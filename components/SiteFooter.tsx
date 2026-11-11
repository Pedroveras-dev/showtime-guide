// Rodapé com a atribuição exigida pela licença dos dados da TVmaze (CC BY-SA 4.0).
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <p>
          Dados de séries, episódios e programação fornecidos pela{" "}
          <a href="https://www.tvmaze.com">TVmaze</a>, sob a licença{" "}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br" rel="license">
            CC BY-SA 4.0
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
