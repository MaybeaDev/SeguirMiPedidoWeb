import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, query, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
export interface RutaContext {
    id: string;
    alias: string,
    transportista: string,
    transportistaNombre: string,
    activa: boolean,
    cargado: boolean,
    enReparto: boolean,
    completado: boolean,
}
export interface TransportistaContext {
    correo: string,
    nombre: string,
    rut: string,
    telefono: string,
    id: string,
    tipo:number,
    ultimaConexion:Timestamp,
    versionApp:string
}
export interface PaqueteContext {
    id: string;
    campaña: string;
    consultora: string;
    contacto: string;
    direccion: string;
    estado: number;
    facturacion: string;
    historial: {
        fecha: Timestamp,
        estado: number,
        detalles: string,
    }[];
    receptor: string;
    referencia: string;
    ruta: string;
    rutaAlias: string;
    transportistaNombre: string
}
const PrivateRoute: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [premiosContext, setPremiosContext] = useState<Record<string, {premios:Record<string, number>, transportista:string}>>({});
    const [paquetesContext, setPaquetes] = useState<PaqueteContext[]>([]);
    const [rutasContext, setRutas] = useState<Record<string, RutaContext>>({});
    const [transportistasContext, setTransportistas] = useState<Record<string, TransportistaContext>>({});

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        getTransportistas()
        getRutas()
        getPaquetes()
        getPremios()
        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const getPaquetes = () => {
        const q = query(collection(db, "Paquetes"));
        onSnapshot(q, async (querySnapshot) => {
            const paq: PaqueteContext[] = [];
            querySnapshot.forEach((doc) => {
                const paquete:PaqueteContext = {
                    id: doc.id,
                    campaña: doc.data().campania ?? null,
                    consultora: doc.data().consultora ?? null,
                    contacto: doc.data().contacto ?? null,
                    direccion: doc.data().direccion ?? null,
                    estado: doc.data().estado ?? null,
                    facturacion: doc.data().facturacion ?? null,
                    historial: doc.data().historial ?? null,
                    receptor: doc.data().receptor ?? null,
                    referencia: doc.data().referencia ?? null,
                    ruta: doc.data().ruta ?? null,
                    rutaAlias: doc.data().rutaAlias ?? null,
                    transportistaNombre: doc.data().transportistaNombre ?? null
                }
                paq.push(paquete)
            })
            console.log("Paquetes cambiados")
            paq.sort((a, b) => b.id.localeCompare(a.id));
            paq.sort((a, b) => {
                return b.historial[b.historial.length - 1].fecha.toDate().getTime() - a.historial[a.historial.length - 1].fecha.toDate().getTime()
            });
            setPaquetes(paq);
        })
    };
    const getPremios = () => {
        const q = query(collection(db, "Premios"));
        onSnapshot(q, (querySnapshot) => {
            const premios: Record<string, {premios:Record<string, number>, transportista:string}> = {}
            querySnapshot.forEach((doc) => {
                premios[doc.id] = {premios: doc.data().premios, transportista: doc.data().transportista}
            })
            setPremiosContext(premios)
        })
    }
    const getRutas = () => {
        const q = query(collection(db, "Rutas"));
        onSnapshot(q, (querySnapshot) => {
            const rutas: { [key: string]: RutaContext } = {}
            querySnapshot.forEach((doc) => {
                const alias = doc.data().alias.trim()
                const ruta: RutaContext = {
                    id: doc.id,
                    alias: alias.charAt(0).toUpperCase() + alias.slice(1).toLowerCase(),
                    transportista: doc.data().transportista ?? "",
                    transportistaNombre: doc.data().transportistaNombre ?? "",
                    activa: doc.data().activa,
                    cargado: doc.data().cargado,
                    enReparto: doc.data().en_reparto,
                    completado: doc.data().completado
                }
                if (ruta.transportistaNombre != undefined) {
                    ruta.transportistaNombre = capitalize(ruta.transportistaNombre)
                }
                if (ruta.transportistaNombre == "" && ruta.transportista != "") {
                    const transportista = transportistasContext[ruta.transportista]
                    if (transportista != undefined) {
                        ruta.transportistaNombre = capitalize(transportista.nombre)
                    }
                }
                rutas[ruta.id] = ruta
            })
            setRutas(rutas)
        })
    }
    const getTransportistas = () => {
        const q = query(collection(db, "Usuarios"));
        onSnapshot(q, (querySnapshot) => {
            const transportistas: { [key: string]: TransportistaContext } = {}
            querySnapshot.forEach((doc) => {
                const transportista: TransportistaContext = {
                    correo: doc.data().correo,
                    nombre: capitalize(doc.data().nombre),
                    rut: doc.data().rut,
                    telefono: doc.data().telefono,
                    id: doc.id,
                    tipo: doc.data().tipo,
                    ultimaConexion: doc.data().ultimaConexion,
                    versionApp: doc.data().versionApp ?? null
                }
                transportistas[transportista.id] = transportista
            })
            setTransportistas(transportistas)
        })
    }
    function capitalize(str: string): string {
        return str
            .trim()
            .split(" ") // Dividir la cadena en palabras
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalizar cada palabra
            .join(" "); // Unir las palabras nuevamente
    }




    if (loading) { return <div>Loading...</div>; }
    if (!user) { return <Navigate to="/login" />; }
    return <Outlet context={{ paquetesContext, premiosContext, rutasContext, transportistasContext }} />;
};

export default PrivateRoute;
