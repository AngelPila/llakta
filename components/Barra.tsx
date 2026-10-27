import Link from "next/link";
import { Icon, Mark } from "./ui";

// La barra de barro de arriba, la misma en el inicio y en las pantallas a pantalla completa.
export default function Barra({ proyectos }: { proyectos?: boolean }) {
  return (
    <header className="home-bar">
      <Link href="/" className="home-brand">
        <Mark size={30} /> Llakta
      </Link>
      <nav className="home-nav">
        {proyectos && <a href="#proyectos">Tus proyectos</a>}
        <Link href="/comunidad">
          <Icon name="globe" /> Comunidad
        </Link>
      </nav>
    </header>
  );
}
