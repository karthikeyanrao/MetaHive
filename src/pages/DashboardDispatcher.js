import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const DashboardDispatcher = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const db = getFirestore();

    useEffect(() => {
        const dispatchUser = async () => {
            if (!currentUser) {
                navigate('/login');
                return;
            }

            try {
                const userDoc = await getDoc(doc(db, "Users", currentUser.uid));
                if (userDoc.exists()) {
                    const role = userDoc.data().role;
                    if (role === 'Builder') {
                        navigate('/builder-dashboard');
                    } else {
                        navigate('/buyer-dashboard');
                    }
                }
            } catch (error) {
                console.error("Error dispatching user:", error);
            }
        };

        dispatchUser();
    }, [currentUser, navigate, db]);

    return null;
};

export default DashboardDispatcher;
