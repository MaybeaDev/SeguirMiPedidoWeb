import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, query, SnapshotMetadata, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

export interface RutaContext {
    id: string;
    alias: string;
    transportista: string;
    transportistaNombre: string;
    activa: boolean;
    cargado: boolean;
    enReparto: boolean;
    completado: boolean;
}

export interface TransportistaContext {
    correo: string;
    nombre: string;
    rut: string;
    telefono: string;
    id: string;
    tipo: number;
    ultimaConexion: Timestamp;
    versionApp: string;
}

export interface PaqueteContext {
    id: string;
    campaña: string;
    zona: string;
    consultora: string;
    contacto: string;
    direccion: string;
    estado: number;
    facturacion: string;
    historial: {
        fecha: Timestamp;
        estado: number;
        detalles: string;
    }[];
    receptor: string;
    referencia: string;
    ruta: string;
    rutaAlias: string;
    transportistaNombre: string;
}

const PrivateRoute: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [userType, setUserType] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [premiosContext, setPremiosContext] = useState<Record<string, { premios: Record<string, number>; transportista: string }>>({});
    const [paquetesContext, setPaquetes] = useState<PaqueteContext[]>([]);
    const [rutasContext, setRutas] = useState<Record<string, RutaContext>>({});
    const [transportistasContext, setTransportistas] = useState<Record<string, TransportistaContext>>({});
    const nav = useNavigate()

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            const tipoUsuario = localStorage.getItem('currentUser') ?? ""
            setUserType(parseInt(tipoUsuario));
            setUser(user);
            setLoading(false);
        });
        if (userType != 3){
            const clTransportistas = getTransportistas();
            const clRutas = getRutas();
            const clPaquetes = getPaquetes();
            const clPremios = getPremios();
            const cleanUp = () => {
                clTransportistas()
                clRutas()
                clPaquetes()
                clPremios()
                unsubscribe()
            }
            return () => cleanUp();
        } else {
            return () => unsubscribe()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const logSource = (metadata: SnapshotMetadata, context: string) => {
        if (metadata.fromCache) {
            console.log(`[${context}] Datos obtenidos desde la caché.`);
        } else {
            console.log(`[${context}] Datos obtenidos desde Firestore.`);
        }
    };

    const getPaquetes = () => {
        const q = query(collection(db, 'Paquetes'));
        return onSnapshot(q, (querySnapshot) => {
            logSource(querySnapshot.metadata, 'paquetesContext');
            const paq: PaqueteContext[] = [];
            querySnapshot.forEach((doc) => {
                const paquete: PaqueteContext = {
                    id: doc.id,
                    campaña: doc.data().campania ?? null,
                    zona: doc.data().zona ?? null,
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
                    transportistaNombre: doc.data().transportistaNombre ?? null,
                };
                paq.push(paquete);
            });
            paq.sort((a, b) => b.id.localeCompare(a.id));
            paq.sort((a, b) => {
                return b.historial[b.historial.length - 1].fecha.toDate().getTime() - a.historial[a.historial.length - 1].fecha.toDate().getTime();
            });
            setPaquetes(paq);
        });
    };

    const getPremios = () => {
        const q = query(collection(db, 'Premios'));
        return onSnapshot(q, (querySnapshot) => {
            const premios: Record<string, { premios: Record<string, number>; transportista: string, entregado:boolean }> = {};
            querySnapshot.forEach((doc) => {
                premios[doc.id] = { premios: doc.data().premios, transportista: doc.data().transportista, entregado: doc.data().entregado ?? false };
            });
            setPremiosContext(premios);
        });
    };

    const getRutas = () => {
        const q = query(collection(db, 'Rutas'));
        return onSnapshot(q, (querySnapshot) => {
            logSource(querySnapshot.metadata, 'rutasContext');
            const rutas: { [key: string]: RutaContext } = {};
            querySnapshot.forEach((doc) => {
                const alias = doc.data().alias.trim();
                const ruta: RutaContext = {
                    id: doc.id,
                    alias: alias.charAt(0).toUpperCase() + alias.slice(1).toLowerCase(),
                    transportista: doc.data().transportista ?? '',
                    transportistaNombre: doc.data().transportistaNombre ?? '',
                    activa: doc.data().activa,
                    cargado: doc.data().cargado,
                    enReparto: doc.data().en_reparto,
                    completado: doc.data().completado,
                };
                rutas[ruta.id] = ruta;
            });
            setRutas(rutas);
        });
    };

    const getTransportistas = () => {
        const q = query(collection(db, 'Usuarios'));
        return onSnapshot(q, (querySnapshot) => {
            logSource(querySnapshot.metadata, 'transportistasContext');
            const transportistas: { [key: string]: TransportistaContext } = {};
            querySnapshot.forEach((doc) => {
                const transportista: TransportistaContext = {
                    correo: doc.data().correo,
                    nombre: capitalize(doc.data().nombre),
                    rut: doc.data().rut,
                    telefono: doc.data().telefono,
                    id: doc.id,
                    tipo: doc.data().tipo,
                    ultimaConexion: doc.data().ultimaConexion,
                    versionApp: doc.data().versionApp ?? null,
                };
                transportistas[transportista.id] = transportista;
            });
            setTransportistas(transportistas);
        });
    };

    function capitalize(str: string): string {
        return str
            .trim()
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    if (loading) {
        return <div>Loading...</div>;
    }
    if (!user) {
        return <Navigate to="/login" />;
    }
    if (userType == 3) {
        nav("/reportes");
    }
    return <Outlet context={{ paquetesContext, premiosContext, rutasContext, transportistasContext, user , userType }} />;
};

export default PrivateRoute;
