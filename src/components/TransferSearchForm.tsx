import { Car, Clock } from 'lucide-react'

export function TransferSearchForm() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
      <div className="flex justify-center">
        <div className="bg-purple-100 text-purple-600 p-4 rounded-2xl">
          <Car className="w-10 h-10" />
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-800">Traslados — Próximamente</h3>

      <p className="text-gray-500 max-w-sm mx-auto">
        Estamos integrando un proveedor de traslados aeropuerto ↔ hotel.
        Pronto podrás buscar transfers privados, compartidos y taxis.
      </p>

      <div className="bg-purple-50 border border-purple-100 rounded-xl px-5 py-4 text-sm text-purple-700 text-left space-y-2 max-w-sm mx-auto">
        <p className="font-semibold mb-1">Qué vas a poder buscar:</p>
        <p className="flex items-center gap-2"><Clock className="w-4 h-4 shrink-0" /> Transfer privado aeropuerto → hotel</p>
        <p className="flex items-center gap-2"><Clock className="w-4 h-4 shrink-0" /> Transfer compartido (precio reducido)</p>
        <p className="flex items-center gap-2"><Clock className="w-4 h-4 shrink-0" /> Taxi disponible en aeropuerto</p>
        <p className="flex items-center gap-2"><Clock className="w-4 h-4 shrink-0" /> Comparativa de precios y proveedores</p>
      </div>
    </div>
  )
}
