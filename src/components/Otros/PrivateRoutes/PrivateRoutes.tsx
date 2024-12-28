import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { collection, DocumentData, onSnapshot, query, QueryDocumentSnapshot, Timestamp, where } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
export interface RutaContext {
    id: string;
    alias: string,
    transportista: string,
    transportistaNombre: string,
    activa:boolean,
    cargado:boolean,
    enReparto:boolean,
    completado:boolean,
}
export interface TransportistaContext {
    nombre: string,
    id: string,
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
    transportista: string
    transportistaNombre: string
}
const PrivateRoute: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [paquetesContext, setPaquetes] = useState<PaqueteContext[]>([]);
    const [rutasContext, setRutas] = useState<Record<string, RutaContext>>({});
    const [transportistas, setTransportistas] = useState<Record<string, TransportistaContext>>({});

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user); // Actualizamos el estado con el usuario autenticado
            setLoading(false); // Dejamos de cargar una vez que obtenemos el estado de autenticación
        });
        getRutas()
        getTransportistas()
        return () => unsubscribe();
    }, []);
    useEffect(() => {
        if (Object.keys(rutasContext).length != 0 && Object.keys(transportistas).length != 0 && paquetesContext.length == 0) {
            getPaquetes()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rutasContext, transportistas])
    const getPaquetes = () => {
        const q = query(collection(db, "Paquetes"));
        onSnapshot(q, async (querySnapshot) => {
            const paq: PaqueteContext[] = [];
            querySnapshot.forEach((doc) => {
                const paquete = buscarRutaYTransportista(doc)
                if (paquete != undefined) {
                    paq.push(paquete)
                }
            })
            paq.sort((a, b) => b.id.localeCompare(a.id));
            paq.sort((a, b) => {
                return b.historial[b.historial.length - 1].fecha.toDate().getTime() - a.historial[a.historial.length - 1].fecha.toDate().getTime()
            });
            setPaquetes(paq);
        })
    };
    const getRutas = () => {
        const q = query(collection(db, "Rutas"));
        onSnapshot(q, (querySnapshot) => {
            const rutas: { [key: string]: RutaContext } = {}
            querySnapshot.forEach((doc) => {
                const ruta: RutaContext = {
                    id: doc.id,
                    alias: doc.data().alias,
                    transportista: doc.data().transportista,
                    transportistaNombre: doc.data().transportistaNombre,
                    activa: doc.data().activa,
                    cargado: doc.data().cargado,
                    enReparto: doc.data().en_reparto,
                    completado: doc.data().completado
                }
                rutas[ruta.id] = ruta
            })
            setRutas(rutas)
        })
    }
    const getTransportistas = () => {
        const q = query(collection(db, "Usuarios"), where("tipo", "==", 0));
        onSnapshot(q, (querySnapshot) => {
            const transportistas: { [key: string]: TransportistaContext } = {}
            querySnapshot.forEach((doc) => {
                const transportista: TransportistaContext = {
                    nombre: doc.data().nombre,
                    id: doc.id
                }
                transportistas[transportista.id] = transportista
            })
            setTransportistas(transportistas)
        })
    }
    const buscarRutaYTransportista = (doc: QueryDocumentSnapshot<DocumentData, DocumentData>): PaqueteContext|undefined => {
        if (doc.data() !== undefined) {
            const paquete:PaqueteContext =  {
                id: doc.id,
                campaña: doc.data().campania ?? "",
                consultora: doc.data().consultora ?? "",
                contacto: doc.data().contacto ?? "",
                direccion: doc.data().direccion ?? "",
                estado: doc.data().estado,
                facturacion: doc.data().facturacion ?? "",
                historial: doc.data().historial ?? [],
                receptor: doc.data().receptor ?? "",
                referencia: doc.data()!.referencia ?? doc.data()!.ciudad ?? "",
                ruta: doc.data().ruta ?? "",
                rutaAlias:"",
                transportista: doc.data().transportista ??  "",
                transportistaNombre: ""
            }
            if (paquete.transportista != "") {
                console.log(paquete.transportista)
                const transportista = transportistas[paquete.transportista] ?? null
                console.log(transportista)
                if (transportista != null) {
                    paquete.transportistaNombre = transportista.nombre
                } else {
                    paquete.transportistaNombre = paquete.transportista
                }
            }
            if (paquete.ruta != ""){
                paquete.rutaAlias = rutasContext[paquete.ruta].alias
                if (paquete.transportistaNombre == "") {
                    paquete.transportistaNombre = rutasContext[paquete.ruta].transportistaNombre ?? ""
                }
            }
            return paquete
        }
    }





    if (loading) { return <div>Loading...</div>; }
    if (!user) { return <Navigate to="/login" />; }
    return <Outlet context={{ paquetesContext, rutasContext }} />;
};

export default PrivateRoute;
