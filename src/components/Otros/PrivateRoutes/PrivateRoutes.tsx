import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

const PrivateRoute: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user); // Actualizamos el estado con el usuario autenticado
            setLoading(false); // Dejamos de cargar una vez que obtenemos el estado de autenticación
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div>Loading...</div>; // Puedes agregar un spinner de carga si lo deseas
    }

    if (!user) {
        // Si no hay usuario autenticado, redirige a la página de login
        return <Navigate to="/login" />;
    }
    // Si el usuario está autenticado, renderiza las rutas hijas
    return <Outlet />;
};

export default PrivateRoute;
