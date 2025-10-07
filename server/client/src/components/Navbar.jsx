import React, { useEffect, useState } from 'react'
import logo from "../images/logo.png"
import { RiSearchLine } from "react-icons/ri";
import Avatar from 'react-avatar';
import { api_base_url } from '../Helper';
import { useNavigate } from 'react-router-dom';


const Navbar = () => {

  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const navigate = useNavigate();

  const getUser = () => {
    fetch(api_base_url + "/getUser", {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: localStorage.getItem("userId")
      })
    }).then(res => res.json()).then(data => {
      if (data.success == false) {
        setError(data.message)
      }
      else {
        setData(data.user)
      }
    })
  };

  const logout = () => {
    fetch(api_base_url + "/logout", {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: localStorage.getItem("userId")
      })
    }).then(res => res.json()).then(data => {
      if (data.success == false) {
        setError(data.message)
      }
      else {
        localStorage.removeItem("userId");
        localStorage.removeItem("token");
        localStorage.removeItem("isLoggedIn");
        navigate("/login");
      }
    })

  }

  useEffect(() => {
    getUser();
  }, [])


  return (
    <>
      <div className="navbar flex items-center px-[70px] h-[70px] justify-between bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 font-semibold gap-2 rounded-b-xl">
        <img src={logo} alt="" />

        <div className="right flex items-center justify-end gap-2">
         

          <button onClick={logout} className='p-[5px] min-w-[80px] bg-red-500 text-white rounded-lg border-0 transition-all hover:bg-red-600'>Logout</button>

          <Avatar name={data ? data.name : ""} className='cursor-pointer ' size="40" round="50%" />
        </div>
      </div>
    </>
  )
}

export default Navbar