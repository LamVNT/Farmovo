import {NavLink} from "react-router-dom";
import {FaBell, FaLock, FaUser} from "react-icons/fa";

const ProfileSidebar = () => {
    const navItems = [
        {name: "Profile", icon: <FaUser/>, to: "/profile"},
        {name: "Security", icon: <FaLock/>, to: "/profile/security"},
        {name: "Notification", icon: <FaBell/>, to: "/profile/notification"},
    ];

    return (
        <div className="md:w-60 w-full md:min-h-screen bg-white border-r p-5">
            {navItems.map((item) => (
                <NavLink
                    key={item.name}
                    to={item.to}
                    className={({isActive}) =>
                        `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 text-gray-700 hover:bg-gray-100 transition ${
                            isActive ? "bg-gray-200 font-semibold" : ""
                        }`
                    }
                >
                    {item.icon}
                    {item.name}
                </NavLink>
            ))}
        </div>
    );
};

export default ProfileSidebar;
