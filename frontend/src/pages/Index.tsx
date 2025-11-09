import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-accent/20 to-background">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Bem-vindo ao App
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Sua aplicação moderna de autenticação está pronta para uso
        </p>
        <Button
          onClick={() => navigate("/auth")}
          size="lg"
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all"
        >
          Acessar Login
        </Button>
      </div>
    </div>
  );
};

export default Index;
