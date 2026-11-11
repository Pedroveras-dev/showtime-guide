import Link from "next/link";

// Exibido quando notFound() é chamado: id inválido ou série inexistente na TVmaze.
export default function ShowNotFound() {
  return (
    <>
      <h1>Série não encontrada</h1>
      <p>
        Não encontramos esta série na TVmaze. Confira o endereço ou{" "}
        <Link href="/">faça uma nova busca</Link>.
      </p>
    </>
  );
}
