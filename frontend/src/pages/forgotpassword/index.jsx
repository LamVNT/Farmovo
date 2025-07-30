import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [repeatPassword, setRepeatPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [expirationTime, setExpirationTime] = useState(null);
    const countdownRef = useRef(null);
    const navigate = useNavigate();

    const api = import.meta.env.VITE_API_URL;

    const resetMessages = () => {
        setMessage("");
        setError("");
    };

    // Countdown timer effect
    useEffect(() => {
        if (timeLeft > 0) {
            countdownRef.current = setTimeout(() => {
                setTimeLeft(timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0 && step === 2) {
            setError("⏰ Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.");
        }
        
        return () => {
            if (countdownRef.current) {
                clearTimeout(countdownRef.current);
            }
        };
    }, [timeLeft, step]);

    // Reset timer when step changes
    useEffect(() => {
        if (step !== 2) {
            setTimeLeft(0);
            if (countdownRef.current) {
                clearTimeout(countdownRef.current);
            }
        }
    }, [step]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSendOTP = async () => {
        resetMessages();
        setLoading(true);
        console.log("Bắt đầu gửi OTP cho email:", email);
        
        try {
            const res = await axios.post(`${api}/forgot-password/verifyMail/${email}`);
            console.log("Response từ server:", res.data);
            
            // Lấy thời gian hết hạn từ response
            if (res.data.expirationTime) {
                const now = Date.now();
                const expiration = res.data.expirationTime;
                const timeRemaining = Math.max(0, Math.floor((expiration - now) / 1000));
                
                console.log("Thời gian hết hạn:", new Date(expiration));
                console.log("Thời gian còn lại:", timeRemaining, "giây");
                
                setExpirationTime(expiration);
                setTimeLeft(timeRemaining);
            }
            
            // Reset OTP input khi gửi lại
            setOtp("");
            
            setMessage("📩 OTP đã được gửi đến email của bạn.");
            setStep(2);
        } catch (err) {
            console.error("Lỗi khi gửi OTP:", err);
            console.error("Response data:", err.response?.data);
            console.error("Response status:", err.response?.status);
            console.error("Error message:", err.message);
            
            let errorMessage = "";
            if (err.response?.status === 404) {
                errorMessage = "❌ Email không tồn tại trong hệ thống.";
            } else if (err.response?.data) {
                errorMessage = "⚠️ " + (typeof err.response.data === 'string' 
                    ? err.response.data 
                    : JSON.stringify(err.response.data));
            } else if (err.message) {
                errorMessage = "⚠️ " + err.message;
            } else {
                errorMessage = "⚠️ Đã xảy ra lỗi khi gửi OTP. Vui lòng thử lại.";
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };


    const handleVerifyOTP = async () => {
        resetMessages();
        setLoading(true);
        
        // Add delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        try {
            const res = await axios.post(`${api}/forgot-password/verifyOtp/${email}`, {
                otp: otp
            });
            
            if (res.data.status === "success") {
                setMessage("✅ OTP chính xác.");
                setStep(3);
                // Dừng countdown khi OTP được xác minh thành công
                if (countdownRef.current) {
                    clearTimeout(countdownRef.current);
                }
                setTimeLeft(0);
            } else {
                setError(res.data.message || "❌ OTP không hợp lệ.");
            }
        } catch (err) {
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.response?.status === 400) {
                setError("❌ Mã OTP không đúng. Vui lòng kiểm tra lại.");
            } else if (err.response?.status === 404) {
                setError("❌ Email không tồn tại trong hệ thống.");
            } else {
                setError("❌ Xác minh OTP thất bại. Vui lòng thử lại.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        resetMessages();
        if (password !== repeatPassword) {
            setError("❌ Mật khẩu nhập lại không khớp.");
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${api}/forgot-password/change-password/${email}`, {
                password,
                repeatPassword,
            });
            setMessage("✅ Mật khẩu đã được thay đổi thành công. Đang chuyển hướng...");
            setTimeout(() => navigate("/login"), 2000);
            // eslint-disable-next-line no-unused-vars
        } catch (err) {
            if (err.response?.status === 400 && err.response?.data?.includes("Password validation failed")) {
                setError("❌ " + err.response.data);
            } else {
                setError("❌ Đổi mật khẩu thất bại.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow bg-white space-y-4">
            <h2 className="text-2xl font-semibold text-center mb-4">Forgot Password</h2>

            {message && <p className="text-green-600 text-sm">{message}</p>}
            {error && <p className="text-red-600 text-sm">{error}</p>}

            {step === 1 && (
                <>
                    <label className="block text-sm font-medium">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border px-3 py-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required
                    />
                    <button
                        onClick={handleSendOTP}
                        disabled={loading}
                        className={`w-full py-2 rounded text-white ${loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"}`}
                    >
                        {loading ? "Sending OTP..." : "Send OTP"}
                    </button>
                </>
            )}

            {step === 2 && (
                <>
                    <label className="block text-sm font-medium">Nhập mã OTP</label>
                    <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full border px-3 py-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        required
                        maxLength={6}
                        placeholder="Nhập 6 số OTP"
                    />
                    
                    {/* Countdown timer */}
                    {timeLeft > 0 && (
                        <div className="text-center mb-4">
                            <div className="text-sm text-gray-600">
                                Mã OTP sẽ hết hạn sau:
                            </div>
                            <div className={`text-lg font-bold ${timeLeft <= 10 ? 'text-red-600' : 'text-blue-600'}`}>
                                {formatTime(timeLeft)}
                            </div>
                        </div>
                    )}
                    
                    {/* Loading spinner for OTP verification */}
                    {loading && (
                        <div className="text-center mb-4">
                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                            <div className="text-sm text-gray-600">
                                Đang xác minh mã OTP...
                            </div>
                        </div>
                    )}
                    
                    <button
                        onClick={handleVerifyOTP}
                        disabled={loading || timeLeft === 0}
                        className={`w-full py-2 rounded text-white ${
                            loading || timeLeft === 0 
                                ? "bg-gray-400 cursor-not-allowed" 
                                : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                        {loading ? "🔍 Đang xác minh OTP..." : timeLeft === 0 ? "OTP đã hết hạn" : "Xác minh OTP"}
                    </button>
                    
                    <button
                        onClick={() => {
                            console.log("Gửi lại OTP clicked");
                            handleSendOTP();
                        }}
                        disabled={loading || timeLeft > 0}
                        className={`w-full mt-2 py-2 rounded ${
                            loading || timeLeft > 0
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-green-600 hover:bg-green-700 text-white"
                        }`}
                    >
                        {loading ? "Đang gửi..." : timeLeft > 0 ? "Chờ OTP hết hạn..." : "Gửi lại OTP"}
                    </button>
                    

                    
                    <button
                        onClick={() => {
                            setStep(1);
                            setTimeLeft(0);
                            if (countdownRef.current) {
                                clearTimeout(countdownRef.current);
                            }
                        }}
                        className="w-full mt-2 bg-gray-300 text-black py-2 rounded hover:bg-gray-400"
                    >
                        ← Quay lại
                    </button>
                </>
            )}

            {step === 3 && (
                <>
                    <label className="block text-sm font-medium">Mật khẩu mới</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border px-3 py-2 rounded mb-4"
                        required
                    />
                    <label className="block text-sm font-medium">Nhập lại mật khẩu</label>
                    <input
                        type="password"
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                        className="w-full border px-3 py-2 rounded mb-4"
                        required
                    />
                    
                    {/* Password requirements */}
                    <div className="bg-gray-50 p-3 rounded text-xs text-gray-600 mb-4">
                        <p className="font-medium mb-2">Yêu cầu mật khẩu:</p>
                        <ul className="space-y-1">
                            <li>• Ít nhất 8 ký tự</li>
                            <li>• Chứa ít nhất 1 chữ hoa</li>
                            <li>• Chứa ít nhất 1 chữ thường</li>
                            <li>• Chứa ít nhất 1 số</li>
                            <li>• Chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*()_+-=[]{}|;:,.)</li>
                            <li>• Không chứa ký tự liên tiếp (abc, 123)</li>
                            <li>• Không chứa ký tự lặp lại (aaa, 111)</li>
                        </ul>
                    </div>
                    
                    <button
                        onClick={handleChangePassword}
                        disabled={loading}
                        className={`w-full py-2 rounded text-white ${loading ? "bg-green-400" : "bg-green-600 hover:bg-green-700"}`}
                    >
                        {loading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
                    </button>
                    <button
                        onClick={() => setStep(2)}
                        className="w-full mt-2 bg-gray-300 text-black py-2 rounded hover:bg-gray-400"
                    >
                        ← Quay lại
                    </button>
                </>
            )}
        </div>
    );
};

export default ForgotPassword;
