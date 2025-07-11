import {Outlet} from "react-router-dom";
import ProfileSidebar from "../components/Sidebar/ProfileSidebar.jsx";

const ProfileLayout = () => {
    return (
        <div className="md:flex bg-gray-50 min-h-screen">
            <ProfileSidebar/>
            <main className="flex-1 p-6">
                <Outlet/>
            </main>
        </div>
    );
};

export default ProfileLayout;
