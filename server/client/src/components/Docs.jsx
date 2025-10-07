import React, { useState } from "react";
import docsIcon from "../images/docsIcon.png";
import { MdDelete } from "react-icons/md";
import deleteImg from "../images/delete.png";
import { api_base_url } from "../Helper";
import { useNavigate } from "react-router-dom";

const Docs = ({ docs, getData }) => {
  const [error, setError] = useState("");
  const [isDeleteModelShow, setIsDeleteModelShow] = useState(false);

  const docID = `doc-${docs._id}`;
  const navigate = useNavigate();

  const deleteDoc = (id, docID) => {
    let doc = document.getElementById(docID);
    fetch(api_base_url + "/deleteDoc", {
      mode: "cors",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        docId: id,
        userId: localStorage.getItem("userId"),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) setError(data.message);
        else {
          setIsDeleteModelShow(false);
          doc.remove();
          getData();
        }
      })
      .catch((error) => {
        console.error(error);
        setError("An error occurred while deleting the document.");
      });
  };

  return (
    <>
      <div
        id={docID}
        className="docs cursor-pointer rounded-2xl flex items-center justify-between p-3 bg-white shadow-md max-w-[500px]"
      >
        <div
          onClick={() => navigate(`/createDocs/${docs._id}`)}
          className="flex items-center gap-3 overflow-hidden"
        >
          <img
            src={docsIcon}
            alt="Document Icon"
            className="w-12 h-12 flex-shrink-0"
          />
          <div className="overflow-hidden">
            <h3
              className="text-lg md:text-xl font-semibold text-gray-800 truncate"
              title={docs.title}
            >
              {docs.title}
            </h3>
            <p className="text-sm text-gray-500 mt-1 truncate">
              Created: {new Date(docs.date).toDateString()}
            </p>
            <p className="text-sm text-gray-500 mt-1 truncate">
              Updated: {new Date(docs.lastUpdate).toDateString()}
            </p>
          </div>
        </div>
        <div className="pl-3 flex-shrink-0">
          <MdDelete
            onClick={() => setIsDeleteModelShow(true)}
            className="text-xl md:text-2xl text-red-500 cursor-pointer transition-all hover:text-red-600"
          />
        </div>
      </div>

      {isDeleteModelShow && (
        <div className="deleteDocsModelCon fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="deleteModel flex flex-col justify-center p-6 bg-white rounded-3xl w-[90vw] md:w-[400px] shadow-2xl animate-slideUp">
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
              Delete Document
            </h3>
            <div className="flex items-center gap-4">
              <img src={deleteImg} alt="Delete Icon" className="w-12 h-12" />
              <div>
                <h4 className="text-lg font-semibold text-gray-700">
                  Are you sure you want to delete this document?
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex mt-4 items-center gap-3 justify-between w-full">
              <button
                onClick={() => deleteDoc(docs._id, docID)}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Delete
              </button>
              <button
                onClick={() => setIsDeleteModelShow(false)}
                className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.35s ease-out;
        }
      `}</style>
    </>
  );
};

export default Docs;
