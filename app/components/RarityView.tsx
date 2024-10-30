import { SetStateAction, useEffect, useState } from "react";

const ITEMS_PER_PAGE = 8;

const RarityView = () => {
  const [nfts, setNfts] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchNFTs = async () => {
    const response = await fetch("/rarity.json");
    const data = await response.json();
    setNfts(data.nfts);
  };

  useEffect(() => {
    fetchNFTs();
  }, []);

  const indexOfLastNFT = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstNFT = indexOfLastNFT - ITEMS_PER_PAGE;
  const currentNFTs = nfts.slice(indexOfFirstNFT, indexOfLastNFT);

  const paginate = (pageNumber: SetStateAction<number>) =>
    setCurrentPage(pageNumber);

  const totalPages = Math.ceil(nfts.length / ITEMS_PER_PAGE);

  return (
    <div className="flex flex-col items-center">

      {/* NFT VIEW */}
      <div className="grid grid-cols-3 lg:grid-cols-4 gap-4">
        {currentNFTs.map((nft) => (
          <div key={nft.id} className="border p-4 rounded-lg shadow-lg flex flex-col text-center lg:w-50">
            <img
              src={`https://content.nintondo.io/api/pub/content/${nft.id}`}
              alt={nft.name}
              className="mb-2 rounded-lg w-16 h-16 lg:w-36 lg:h-36"
            />
            <h2 className="text-sm hidden lg:flex">{nft.name}</h2>
            <p className="text-sm">Rank: {nft.rank}</p>
          </div>
        ))}
      </div>

       {/* DaisyUI Pagination Buttons */}
       <div className="mt-4 flex justify-between items-center">
        <button
          className="p-2 rounded hover:bg-base-300"
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
        >
          «
        </button>
        <div className="p-2 rounded mx-4">
          {currentPage} of {totalPages}
        </div>
        <button
          className="p-2 rounded hover:bg-base-300"
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          »
        </button>
      </div>
    </div>
  );
};

export default RarityView;
