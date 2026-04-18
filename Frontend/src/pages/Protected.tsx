import { Navigate } from "react-router-dom";

export default function Protected({ children }: { children: JSX.Element }) {
//   const user = localStorage.getItem("userStatus"); // ของคุณใช้ตัวนี้
  const user = sessionStorage.getItem("userStatus");

  if (!user) {
    return <Navigate to="/Login" replace />;
  }

  return children;
}