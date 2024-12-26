import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom"; // Para redirigir al login después de cerrar sesión
import Button from "../Button/Button";

const CerrarSesionButton = () => {
    const auth = getAuth();
    const navigate = useNavigate(); // Hook de navegación de react-router-dom

    const handleLogout = async () => {
        try {
            await signOut(auth); // Cerrar sesión en Firebase
            localStorage.removeItem('currentUser');
            navigate("/login"); // Redirigir a la página de login después de cerrar sesión
        } catch (error) {
            console.error("Error al cerrar sesión: ", error); // Manejo de errores (opcional)
        }
    };

    return (
        <Button onClick={handleLogout}>
            Cerrar sesión
        </Button>
    );
};

export default CerrarSesionButton;
