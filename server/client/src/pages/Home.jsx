import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { BsPlusLg } from "react-icons/bs";
import Docs from "../components/Docs";
import { MdOutlineTitle } from "react-icons/md";
import { api_base_url } from "../Helper";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [isCreateModelShow, setIsCreateModelShow] = useState(false);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const navigate = useNavigate();

  const createDoc = () => {
    if (title === "") {
      setError("Please enter title");
    } else {
      fetch(api_base_url + "/createDoc", {
        mode: "cors",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docName: title,
          userId: localStorage.getItem("userId"),
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setIsCreateModelShow(false);
            navigate(`/createDocs/${data.docId}`);
          } else {
            setError(data.message);
          }
        });
    }
  };

  const getData = () => {
    fetch(api_base_url + "/getAllDocs", {
      mode: "cors",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: localStorage.getItem("userId") }),
    })
      .then((res) => res.json())
      .then((data) => {
        setData(data.docs);
      });
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50">
        <div className="flex flex-col md:flex-row items-center justify-between px-8 md:px-24 pt-12 pb-6 gap-6 md:gap-0">
          <div>
            <h3 className="text-4xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
              All Documents
            </h3>
            <p className="text-gray-500 mt-2 text-sm md:text-base">
              Manage and organize all your important documents seamlessly.
            </p>
          </div>
          <button
            className="btnBlue bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            onClick={() => {
              setIsCreateModelShow(true);
              document.getElementById("title").focus();
            }}
          >
            <BsPlusLg className="text-lg" /> Create New Document
          </button>
        </div>

        <div className="allDocs px-8 md:px-24 mt-10 pb-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data ? (
            data.map((el, index) => (
              <div
                key={index}
                className=" duration-300 hover:scale-102 hover:shadow-xl"
              >
                <Docs docs={el} docID={`doc-${index + 1}`} getData={getData} />
              </div>
            ))
          ) : (
            <div className="col-span-full flex items-center justify-center py-28">
              <div className="text-center animate-fadeIn">
                <div className="text-7xl mb-4">📄</div>
                <p className="text-gray-400 text-lg md:text-xl">
                  No documents yet. Start by creating your first one!
                </p>
              </div>
            </div>
          )
          }
        </div>
      </div>

      {isCreateModelShow && (
        <>
          <div className="createDocsModelCon fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-60 backdrop-blur-sm w-screen h-screen flex items-center justify-center z-50 animate-fadeIn">
            <div className="createDocsModel p-8 bg-white rounded-3xl w-[90vw] md:w-[500px] shadow-3xl transform transition-all duration-300 scale-100 animate-slideUp">
              <h3 className="text-2xl md:text-2xl font-bold text-gray-800 mb-6">
                Create New Document
              </h3>

              <div className="inputCon mt-4">
                <p className="text-sm font-semibold text-gray-600 mb-2">
                  Document Title
                </p>
                <div className="inputBox w-full flex items-center gap-3 border-2 border-gray-200 rounded-xl px-4 py-3 focus-within:border-blue-500 transition-colors duration-300 bg-gray-50 hover:bg-gray-100">
                  <MdOutlineTitle className="text-gray-400 text-xl" />
                  <input
                    onChange={(e) => setTitle(e.target.value)}
                    value={title}
                    type="text"
                    placeholder="Enter document title"
                    id="title"
                    name="title"
                    required
                    className="flex-1 outline-none bg-transparent text-gray-800 placeholder-gray-400 text-sm md:text-base"
                  />
                </div>
                {error && (
                  <p className="text-red-500 text-sm mt-2 animate-shake">
                    {error}
                  </p>
                )}
              </div>

              <div className="flex flex-col md:flex-row items-center gap-3 justify-between w-full mt-8">
                <button
                  onClick={createDoc}
                  className="btnBlue bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-2xl border-0 cursor-pointer flex-1 py-3 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  Create Document
                </button>
                <button
                  onClick={() => {
                    setIsCreateModelShow(false);
                    setError("");
                    setTitle("");
                  }}
                  className="py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl border-0 cursor-pointer flex-1 transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            @keyframes shake {
              0%,
              100% {
                transform: translateX(0);
              }
              25% {
                transform: translateX(-5px);
              }
              75% {
                transform: translateX(5px);
              }
            }
            .animate-fadeIn {
              animation: fadeIn 0.25s ease-out;
            }
            .animate-slideUp {
              animation: slideUp 0.35s ease-out;
            }
            .animate-shake {
              animation: shake 0.3s ease-out;
            }
          `}</style>
        </>
      )}
    </>
  );
};

export default Home;
