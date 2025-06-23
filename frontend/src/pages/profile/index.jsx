import React, { useContext } from "react";
import {MyContext} from "../../App.jsx";


const Profile = () => {
    const context = useContext(MyContext);

    return (
        <div className="bg-white rounded-xl shadow-md p-6 max-w-[600px] mx-auto">
            <h1 className="text-2xl fon t-bold mb-6 text-[#333]">My Profile</h1>
            <div className="flex items-center gap-5 mb-5">
                <img
                    src="https://ecme-react.themenate.net/img/avatars/thumb-1.jpg"
                    className="w-[80px] h-[80px] rounded-full object-cover"
                    alt="Avatar"
                />
                <div>
                    <p className="text-xl font-semibold">Vu Nguyen Tung Lam</p>
                    <p className="text-sm text-gray-500">admin@gmail.com</p>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                        type="text"
                        value="Vu Nguyen Tung Lam"
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300"
                        disabled
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                        type="email"
                        value="admin@gmail.com"
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300"
                        disabled
                    />
                </div>
            </div>
        </div>
    );
};

export default Profile;
