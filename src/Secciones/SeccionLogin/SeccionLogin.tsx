import React, { useState } from "react";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { collection, doc, getDoc, getDocs, query, Timestamp, updateDoc, where } from "firebase/firestore";
import { db } from "../../firebaseConfig" // Asegúrate de importar correctamente tu configuración de Firebase
import classes from "./SeccionLogin.module.css"; // Importamos el módulo CSS

const SeccionLogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string>("");
    const auth = getAuth();
    const navigate = useNavigate();

    const getUsuariosTransportistas = async () => {
        const q = query(collection(db, "Usuarios"), where("tipo", "==", 0))
        const querySnapshot = await getDocs(q);
        let transportistas = {};
        querySnapshot.forEach((doc) => {
            transportistas = {
                ...transportistas,
                [doc.id]: { id: doc.id, nombre: doc.data().nombre, email: doc.data().email, rut: doc.data().rut, telefono: doc.data().telefono }
            }
        });
    }
    const getRutas = async () => {
        const q = query(collection(db, "Rutas"))
        const querySnapshot = await getDocs(q);
        let rutas = {};
        querySnapshot.forEach((doc) => {
            rutas = {
                ...rutas,
                [doc.id]: {
                    alias: doc.data().alias,
                    transportista: doc.data().transportista,
                    activa: doc.data().activa,
                    cargado: doc.data().cargado,
                    completado: doc.data().completado,
                    en_reparto: doc.data().en_reparto
                },
            };
        });
        console.log(rutas);
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            // Iniciar sesión con Firebase Authentication
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Obtener el documento del usuario desde la colección "Users"
            const userDocRef = doc(db, "Usuarios", user.uid);
            const userDoc = await getDoc(userDocRef);
            console.log(user.uid, userDoc.id)

            if (userDoc.exists()) {
                // Verificar si el tipo de usuario es "empresa"
                const userData = userDoc.data();
                console.log(userData?.tipo, "[1, 2].includes(userData?.tipo) ??", [1, 2].includes(userData?.tipo))
                if ([1, 2].includes(userData?.tipo)) {
                    updateDoc(userDocRef, { ultimaConexion: Timestamp.now() });
                    // Si es un usuario de tipo empresa, redirigir al panel de empresa

                    localStorage.setItem('currentUser', userData?.tipo+"")
                    await getRutas()
                    await getUsuariosTransportistas()
                    if (userData?.tipo == 1) {
                        navigate("/SeccionEmpresa");
                    } else {
                        navigate("/SeccionEmpresa/GestionDePaquetes/arriboCarga");
                    }
                    window.location.reload();
                } else {
                    // Si no es un usuario de tipo empresa, mostrar error
                    setError("No tienes acceso al área de empresa.");
                    await signOut(auth);

                }
            } else {
                setError("El usuario no existe en la base de datos.");
            }
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message); // Mostrar el mensaje de error de Firebase
                if (error.message == "Firebase: Error (auth/invalid-credential).") {
                    setError("El usuario no existe... Revisa el usuario y la contraseña");
                }
            } else {
                setError("Ocurrió un error inesperado");
            }
        }
    };

    return (
        <div className={classes.loginContainer}>
            <div className={classes.loginBox}>
                <h2 className={classes.title}>Iniciar sesión</h2>
                {error && <p className={classes.error}>{error}</p>}
                <form onSubmit={handleLogin} className={classes.form}>
                    <center>
                        <input
                            type="email"
                            placeholder="Correo electrónico"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={classes.input}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={classes.input}
                            required
                        />
                    </center>
                    <button type="submit" className={classes.submitButton}>
                        Iniciar sesión
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SeccionLogin;
