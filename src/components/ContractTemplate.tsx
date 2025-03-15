import React from 'react';

interface ContractTemplateProps {
  data: {
    contractNumber: string;
    startDate: string;
    endDate: string;
    customerName: string;
    customerAddress: string;
    customerPhone: string;
    customerEmail: string;
    monthlyAmount: number;
    pests: Array<{
      type: string;
      visitCount: number;
      area: string;
    }>;
  };
}

export const ContractTemplate: React.FC<ContractTemplateProps> = ({ data }) => {
  return (
    <div className="p-8 bg-white text-black">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">İLAÇLAMA HİZMET SÖZLEŞMESİ</h1>
        <div className="inline-block border-2 border-gray-800 px-6 py-2 rounded">
          <p className="text-lg font-semibold">Sözleşme No: {data.contractNumber}</p>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-bold mb-6 pb-2 border-b-2 border-gray-300">1. TARAFLAR</h2>
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">HİZMET VEREN</h3>
            <p className="text-gray-700">İlaçlama Şirketi</p>
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">HİZMET ALAN</h3>
            <p className="font-medium">{data.customerName}</p>
            <p className="text-gray-700">{data.customerAddress}</p>
            <p className="text-gray-700">{data.customerPhone}</p>
            <p className="text-gray-700">{data.customerEmail}</p>
          </div>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-bold mb-6 pb-2 border-b-2 border-gray-300">2. SÖZLEŞME SÜRESİ</h2>
        <div className="bg-gray-50 p-6 rounded-lg">
          <p className="text-lg">
            Bu sözleşme <span className="font-semibold">{new Date(data.startDate).toLocaleDateString('tr-TR')}</span> tarihinde başlayıp,{' '}
            <span className="font-semibold">{new Date(data.endDate).toLocaleDateString('tr-TR')}</span> tarihinde sona erecektir.
          </p>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-bold mb-6 pb-2 border-b-2 border-gray-300">3. HİZMET KAPSAMI</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border-2 border-gray-300 p-4 text-left">Zararlı Türü</th>
              <th className="border-2 border-gray-300 p-4 text-left">Ziyaret Sıklığı</th>
              <th className="border-2 border-gray-300 p-4 text-left">Uygulama Alanı</th>
            </tr>
          </thead>
          <tbody>
            {data.pests.map((pest, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                <td className="border-2 border-gray-300 p-4">{pest.type}</td>
                <td className="border-2 border-gray-300 p-4">
                  {pest.visitCount === 0.33 ? '3 Ayda 1' : `Ayda ${pest.visitCount}`} Ziyaret
                </td>
                <td className="border-2 border-gray-300 p-4">{pest.area}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-bold mb-6 pb-2 border-b-2 border-gray-300">4. ÜCRET</h2>
        <div className="bg-blue-50 p-6 rounded-lg">
          <p className="text-lg">
            Aylık hizmet bedeli <span className="font-bold text-blue-700">{data.monthlyAmount.toLocaleString('tr-TR', {
              style: 'currency',
              currency: 'TRY'
            })}</span> (KDV dahil) olarak belirlenmiştir.
          </p>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-bold mb-6 pb-2 border-b-2 border-gray-300">5. GENEL HÜKÜMLER</h2>
        <ol className="list-decimal list-inside space-y-3 pl-4">
          <li className="text-gray-800">Hizmet bedeli, her ayın ilk haftası içinde ödenir.</li>
          <li className="text-gray-800">İlaçlama hizmetleri, belirlenen program dahilinde gerçekleştirilir.</li>
          <li className="text-gray-800">Acil durumlarda, ek ücret talep edilmeden müdahale edilir.</li>
          <li className="text-gray-800">Kullanılan ilaçlar Sağlık Bakanlığı onaylıdır.</li>
          <li className="text-gray-800">Her uygulama sonrası detaylı rapor düzenlenir.</li>
        </ol>
      </div>

      <div className="mt-16 grid grid-cols-2 gap-16">
        <div className="text-center">
          <p className="font-bold text-lg mb-4">HİZMET VEREN</p>
          <p className="text-gray-700">İmza / Kaşe</p>
          <div className="mt-20 pt-2 border-t-2 border-gray-300">
            <p className="text-gray-600">Tarih: {new Date().toLocaleDateString('tr-TR')}</p>
          </div>
        </div>
        <div className="text-center">
          <p className="font-bold text-lg mb-4">HİZMET ALAN</p>
          <p className="text-gray-700">İmza / Kaşe</p>
          <div className="mt-20 pt-2 border-t-2 border-gray-300">
            <p className="text-gray-600">Tarih: {new Date().toLocaleDateString('tr-TR')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};