export function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">
              Event<span className="text-brand-400">Hub</span>
            </h3>
            <p className="text-sm leading-relaxed">
              A plataforma para encontrar e alugar espaços perfeitos para seus
              eventos.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Explorar</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Festas Infantis
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Casamentos
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Corporativos
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Festivais
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Suporte</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Central de Ajuda
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Termos de Uso
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Privacidade
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Contato</h4>
            <ul className="space-y-2 text-sm">
              <li>contato@eventhub.com.br</li>
              <li>(11) 99999-0000</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center">
          &copy; {new Date().getFullYear()} EventHub. Todos os direitos
          reservados.
        </div>
      </div>
    </footer>
  );
}
