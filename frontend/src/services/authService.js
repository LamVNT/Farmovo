import api from "./axiosClient";

export const login = ({ username, password, rememberMe }) => {
    return api.post("/signin", { username, password, rememberMe });
};

export const logout = () => {
    return api.post("/logout");
};
