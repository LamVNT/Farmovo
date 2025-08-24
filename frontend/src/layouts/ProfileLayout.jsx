import {Outlet} from "react-router-dom";

const ProfileLayout = () => {
    return (
        <div className="bg-gray-50 min-h-screen">
            <main className="p-6">
                <Outlet/>
            </main>
        </div>
    );
};

export default ProfileLayout;
