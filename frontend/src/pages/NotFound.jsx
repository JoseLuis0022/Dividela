import { Link } from "react-router-dom";
import { Compass } from "@phosphor-icons/react";
import PageContainer from "../components/PageContainer.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Button from "../components/Button.jsx";

export default function NotFound() {
  return (
    <PageContainer>
      <EmptyState
        icon={<Compass size={40} weight="duotone" />}
        title="No encontramos esta página"
        description="Puede que el enlace esté incompleto o ya no exista."
        action={
          <Link to="/">
            <Button>Ir al inicio</Button>
          </Link>
        }
      />
    </PageContainer>
  );
}
