import React, { useState, useRef, useEffect } from 'react';
import { Save, X, Square, Circle, Triangle, PenTool as Tool, Download, Undo, Redo, Eraser } from 'lucide-react';
import toast from 'react-hot-toast';

interface Point {
  x: number;
  y: number;
}

interface Wall {
  points: Point[];
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CircleShape {
  x: number;
  y: number;
  radius: number;
  isResizing?: boolean;
}

interface TriangleShape {
  x: number;
  y: number;
  size: number;
  isResizing?: boolean;
}

interface Door {
  x: number;
  y: number;
  rotation: number;
}

interface Text {
  x: number;
  y: number;
  content: string;
}

interface Equipment {
  x: number;
  y: number;
  type: string;
  number: number;
}

interface FloorPlan {
  branch_id: string;
  name: string;
  data: {
    equipment: Equipment[];
    walls: Wall[];
    boxes: Box[];
    circles: CircleShape[];
    triangles: TriangleShape[];
    doors: Door[];
    texts: Text[];
  };
}

interface FloorPlanDrawerProps {
  branchId: string;
  onSave: (floorPlan: FloorPlan) => void;
  onClose: () => void;
  equipmentTypes: string[];
}

interface HistoryState {
  equipment: Equipment[];
  walls: Wall[];
  boxes: Box[];
  circles: CircleShape[];
  triangles: TriangleShape[];
  doors: Door[];
  texts: Text[];
}

const equipmentColors: { [key: string]: string } = {
  'Fare İstasyonu': '#FF6B6B',
  'Sinek Tuzağı': '#4ECDC4',
  'Hamam Böceği İstasyonu': '#45B7D1',
  'Feromon Tuzağı': '#96CEB4',
  'UV Cihazı': '#FFEEAD'
};

export function FloorPlanDrawer({ branchId, onSave, onClose, equipmentTypes }: FloorPlanDrawerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'wall' | 'door' | 'equipment' | 'box' | 'circle' | 'triangle' | 'text'>('wall');
  const [selectedEquipmentType, setSelectedEquipmentType] = useState(equipmentTypes[0] || '');
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [walls, setWalls] = useState<Wall[]>([]);
  const [currentWall, setCurrentWall] = useState<Point[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [circles, setCircles] = useState<CircleShape[]>([]);
  const [triangles, setTriangles] = useState<TriangleShape[]>([]);
  const [doors, setDoors] = useState<Door[]>([]);
  const [texts, setTexts] = useState<Text[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<Point | null>(null);
  const [equipmentCounter, setEquipmentCounter] = useState(1);
  const [selectedShape, setSelectedShape] = useState<{ type: string; index: number } | null>(null);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isErasing, setIsErasing] = useState(false);

  const saveToHistory = () => {
    const newState: HistoryState = {
      equipment,
      walls,
      boxes,
      circles,
      triangles,
      doors,
      texts
    };

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setEquipment(prevState.equipment);
      setWalls(prevState.walls);
      setBoxes(prevState.boxes);
      setCircles(prevState.circles);
      setTriangles(prevState.triangles);
      setDoors(prevState.doors);
      setTexts(prevState.texts);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setEquipment(nextState.equipment);
      setWalls(nextState.walls);
      setBoxes(nextState.boxes);
      setCircles(nextState.circles);
      setTriangles(nextState.triangles);
      setDoors(nextState.doors);
      setTexts(nextState.texts);
      setHistoryIndex(historyIndex + 1);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.fillStyle = '#f0ecec';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#fff';

    walls.forEach(wall => {
      if (wall.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(wall.points[0].x, wall.points[0].y);
      wall.points.slice(1).forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    });

    if (currentWall.length > 0) {
      ctx.beginPath();
      ctx.moveTo(currentWall[0].x, currentWall[0].y);
      currentWall.slice(1).forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }

    boxes.forEach(box => {
      ctx.strokeRect(box.x, box.y, box.width, box.height);
    });

    circles.forEach((circle, index) => {
      ctx.beginPath();
      ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
      ctx.stroke();

      if (selectedShape?.type === 'circle' && selectedShape.index === index) {
        ctx.fillStyle = '#4299e1';
        ctx.beginPath();
        ctx.arc(circle.x + circle.radius, circle.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    triangles.forEach((triangle, index) => {
      ctx.beginPath();
      ctx.moveTo(triangle.x, triangle.y - triangle.size / 2);
      ctx.lineTo(triangle.x - triangle.size / 2, triangle.y + triangle.size / 2);
      ctx.lineTo(triangle.x + triangle.size / 2, triangle.y + triangle.size / 2);
      ctx.closePath();
      ctx.stroke();

      if (selectedShape?.type === 'triangle' && selectedShape.index === index) {
        ctx.fillStyle = '#4299e1';
        ctx.beginPath();
        ctx.arc(triangle.x + triangle.size / 2, triangle.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    doors.forEach(door => {
      ctx.save();
      ctx.translate(door.x, door.y);
      ctx.rotate(door.rotation);
      
      ctx.beginPath();
      ctx.arc(0, 0, 20, -Math.PI/2, Math.PI/2, false);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(0, 20);
      ctx.stroke();
      
      ctx.restore();
    });

    equipment.forEach(eq => {
      const color = equipmentColors[eq.type] || '#000';
      
      ctx.fillStyle = color;
      ctx.strokeStyle = '#000';
      ctx.beginPath();
      ctx.arc(eq.x, eq.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 12px Arial';
      ctx.fillText(eq.number.toString(), eq.x, eq.y);

      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.fillText(eq.type, eq.x, eq.y + 25);
    });

    texts.forEach(text => {
      ctx.fillStyle = '#000';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText(text.content, text.x, text.y);
    });
  }, [walls, currentWall, boxes, circles, triangles, doors, equipment, texts, selectedShape]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isErasing) {
      const threshold = 20;

      const equipmentIndex = equipment.findIndex(eq => {
        const dx = eq.x - x;
        const dy = eq.y - y;
        return Math.sqrt(dx * dx + dy * dy) < threshold;
      });
      if (equipmentIndex !== -1) {
        const newEquipment = [...equipment];
        newEquipment.splice(equipmentIndex, 1);
        setEquipment(newEquipment);
        saveToHistory();
        return;
      }
      return;
    }

    if (mode === 'wall') {
      if (currentWall.length === 0) {
        setCurrentWall([{ x, y }]);
      } else {
        setCurrentWall([...currentWall, { x, y }]);
      }
    } else if (mode === 'door') {
      setDoors([...doors, { x, y, rotation: 0 }]);
    } else if (mode === 'box') {
      setIsDrawing(true);
      setStartPoint({ x, y });
    } else if (mode === 'circle') {
      setCircles([...circles, { x, y, radius: 20 }]);
      setSelectedShape({ type: 'circle', index: circles.length });
    } else if (mode === 'triangle') {
      setTriangles([...triangles, { x, y, size: 40 }]);
      setSelectedShape({ type: 'triangle', index: triangles.length });
    } else if (mode === 'equipment') {
      setEquipment([
        ...equipment,
        {
          x,
          y,
          type: selectedEquipmentType,
          number: equipmentCounter
        }
      ]);
      setEquipmentCounter(prev => prev + 1);
    } else if (mode === 'text') {
      setTextPosition({ x, y });
      setShowTextInput(true);
    }

    saveToHistory();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (mode === 'box' && isDrawing && startPoint) {
      const width = x - startPoint.x;
      const height = y - startPoint.y;
      setBoxes([...boxes.slice(0, -1), { x: startPoint.x, y: startPoint.y, width, height }]);
    } else if (selectedShape) {
      if (selectedShape.type === 'circle') {
        const circle = circles[selectedShape.index];
        if (circle) {
          const dx = x - circle.x;
          const dy = y - circle.y;
          const newRadius = Math.sqrt(dx * dx + dy * dy);
          const newCircles = [...circles];
          newCircles[selectedShape.index] = { ...circle, radius: newRadius };
          setCircles(newCircles);
        }
      } else if (selectedShape.type === 'triangle') {
        const triangle = triangles[selectedShape.index];
        if (triangle) {
          const dx = x - triangle.x;
          const newSize = Math.abs(dx) * 2;
          const newTriangles = [...triangles];
          newTriangles[selectedShape.index] = { ...triangle, size: newSize };
          setTriangles(newTriangles);
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setStartPoint(null);
    setSelectedShape(null);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && currentWall.length > 0) {
      setWalls([...walls, { points: currentWall }]);
      setCurrentWall([]);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentWall]);

  const handleAddText = () => {
    if (textPosition && textInput.trim()) {
      setTexts([...texts, { ...textPosition, content: textInput }]);
      setShowTextInput(false);
      setTextInput('');
      setTextPosition(null);
    }
  };

  const handleExportJPEG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    tempCtx.drawImage(canvas, 0, 0);

    try {
      const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.8);
      const link = document.createElement('a');
      link.download = `${name || 'floor-plan'}.jpg`;
      link.href = dataUrl;
      link.click();
      toast.success('Kroki başarıyla JPEG olarak kaydedildi');
    } catch (error) {
      toast.error('JPEG kaydetme sırasında bir hata oluştu');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="Kroki Adı"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-4 py-2 border rounded-md"
        />
        <div className="flex items-center space-x-2">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="px-4 py-2 text-gray-600 hover:text-gray-700 disabled:opacity-50"
            title="Geri Al"
          >
            <Undo className="h-5 w-5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="px-4 py-2 text-gray-600 hover:text-gray-700 disabled:opacity-50"
            title="İleri Al"
          >
            <Redo className="h-5 w-5" />
          </button>
          <button
            onClick={handleExportJPEG}
            className="px-4 py-2 text-blue-600 hover:text-blue-700 flex items-center"
            title="JPEG olarak kaydet"
          >
            <Download className="h-5 w-5 mr-1" />
            JPEG
          </button>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            setMode('wall');
            setIsErasing(false);
          }}
          className={`px-4 py-2 rounded-md ${mode === 'wall' && !isErasing ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
        >
          Duvar
        </button>
        <button
          onClick={() => {
            setMode('door');
            setIsErasing(false);
          }}
          className={`px-4 py-2 rounded-md ${mode === 'door' && !isErasing ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
        >
          Kapı
        </button>
        <button
          onClick={() => {
            setMode('equipment');
            setIsErasing(false);
          }}
          className={`px-4 py-2 rounded-md ${mode === 'equipment' && !isErasing ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
        >
          <Tool className="h-5 w-5" />
        </button>
        <button
          onClick={() => {
            setMode('box');
            setIsErasing(false);
          }}
          className={`px-4 py-2 rounded-md ${mode === 'box' && !isErasing ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
        >
          <Square className="h-5 w-5" />
        </button>
        <button
          onClick={() => {
            setMode('circle');
            setIsErasing(false);
          }}
          className={`px-4 py-2 rounded-md ${mode === 'circle' && !isErasing ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
        >
          <Circle className="h-5 w-5" />
        </button>
        <button
          onClick={() => {
            setMode('triangle');
            setIsErasing(false);
          }}
          className={`px-4 py-2 rounded-md ${mode === 'triangle' && !isErasing ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
        >
          <Triangle className="h-5 w-5" />
        </button>
        <button
          onClick={() => {
            setMode('text');
            setIsErasing(false);
          }}
          className={`px-4 py-2 rounded-md ${mode === 'text' && !isErasing ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
        >
          Yazı
        </button>
        <button
          onClick={() => setIsErasing(!isErasing)}
          className={`px-4 py-2 rounded-md ${isErasing ? 'bg-red-600 text-white' : 'bg-gray-100'}`}
        >
          <Eraser className="h-5 w-5" />
        </button>
      </div>

      {mode === 'equipment' && (
        <div className="flex space-x-4">
          <select
            value={selectedEquipmentType}
            onChange={(e) => setSelectedEquipmentType(e.target.value)}
            className="px-4 py-2 border rounded-md flex-1"
          >
            {equipmentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="relative border rounded-lg overflow-hidden" style={{ height: '600px' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="w-full h-full bg-white"
          style={{ cursor: 'crosshair' }}
        />
      </div>

      <div className="mt-4 text-sm text-gray-500">
        {mode === 'wall' ? (
          <p>Duvar çizmek için tıklayın. Duvarı tamamlamak için ESC tuşuna basın.</p>
        ) : mode === 'door' ? (
          <p>Kapı eklemek için tıklayın.</p>
        ) : mode === 'equipment' ? (
          <p>Ekipman eklemek için tıklayın. Her ekipman otomatik olarak numaralandırılacaktır.</p>
        ) : mode === 'box' ? (
          <p>Kutu çizmek için tıklayıp sürükleyin.</p>
        ) : mode === 'circle' ? (
          <p>Yuvarlak eklemek için tıklayın. Boyutunu değiştirmek için mavi noktayı sürükleyin.</p>
        ) : mode === 'triangle' ? (
          <p>Üçgen eklemek için tıklayın. Boyutunu değiştirmek için mavi noktayı sürükleyin.</p>
        ) : (
          <p>Yazı eklemek için tıklayın.</p>
        )}
      </div>

      {showTextInput && textPosition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Yazı Ekle</h3>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Yazı içeriğini girin..."
              autoFocus
            />
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowTextInput(false);
                  setTextInput('');
                  setTextPosition(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                İptal
              </button>
              <button
                onClick={handleAddText}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          İptal
        </button>
        <button
          onClick={() => {
            if (!name) {
              toast.error('Lütfen kroki adı girin');
              return;
            }
            onSave({
              branch_id: branchId,
              name,
              data: {
                equipment,
                walls,
                boxes,
                circles,
                triangles,
                doors,
                texts
              }
            });
          }}
          disabled={!name}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-5 w-5 inline-block mr-2" />
          Kaydet
        </button>
      </div>
    </div>
  );
}