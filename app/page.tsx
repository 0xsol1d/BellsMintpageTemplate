"use client";
import { useEffect, useRef, useState } from "react";

import { networks, Psbt } from "belcoinjs-lib";
import { ECPairFactory, ECPairAPI } from "belpair";
import * as ecc from "bells-secp256k1";
import { useNintondo, NintondoProvider } from "nintondo-sdk/react";

import dotenv from "dotenv";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";

import { toastStyles } from "./utils/styles";
import { SATS_PER_BELL } from "./utils/consts";
import { splitTxs } from "./utils/splitTxs";

import Carousel from "./components/Carousel";
import RarityView from "./components/RarityView";
import { Footer } from "./components/Footer";
import { Loader } from "./components/Loader";

dotenv.config();
const privKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;
const mintAddress = process.env.NEXT_PUBLIC_ADDRESS;
const treasuryAddress: string =
  process.env.NEXT_TREASURY_ADDRESS ??
  "";  // put your treasury address in here
const donationAddress: string =
  process.env.NEXT_DONATION_ADDRESS ?? "BEGJMVqLYRJkGwvwmsZDDjERpzxGqdyzXT";

const ECPair: ECPairAPI = ECPairFactory(ecc);

export default function MintPage() {
  return (
    <NintondoProvider>
      <AppEntyPoint />
    </NintondoProvider>
  );
}

const AppEntyPoint = () => {
  const { nintondo } = useNintondo();
  const [rarity, setRarity] = useState<any[]>([]);

  const [connected, setConnected] = useState<any>();
  const [balance, setBalance] = useState<any>();
  const [address, setAddress] = useState<any>();
  const [mintAmount, setMintAmount] = useState<number>(1);

  const [feeRate, setFeeRate] = useState<number>(5);
  const [feeRateSlow, setFeeRateSlow] = useState<number>(5);
  const [feeRateFast, setFeeRateFast] = useState<number>(5);
  const [feeType, setFeeType] = useState<any>("slow");

  const [dataCoingecko, setDataCoingecko] = useState<any>();
  const [isMinting, setIsMinting] = useState(false);
  const [utxos, setUtxos] = useState<any>();

  const [whitelist, setWhitelist] = useState(null);
  const [isWhitelisted, setIsWhitelisted] = useState<boolean>(false);

  const [mintPrice, setMintPrice] = useState<number>(2);            //Set mint price here
  const [mintSupply, setMintSupply] = useState<number>(2222);       //Set mint supply here

  const modalRef = useRef<HTMLDialogElement>(null);

  interface Inscription {
    id: string;
  }

  const [walletCount, setWalletCount] = useState<number>(0);
  const [ids, setIds] = useState<string[]>([]);

  const fetchAllPagesFromWallet = async (account: string, pageSize: number) => {
    try {
      const initialResponse = await fetch(
        `https://content.nintondo.io/api/pub/search?content_filter=images&page_size=${pageSize}&page=1&account=${account}`
      );
      const initialData = await initialResponse.json();
      const totalPages = initialData.pages;

      const allIds: string[] = [];

      for (let page = 1; page <= totalPages; page++) {
        const response = await fetch(
          `https://content.nintondo.io/api/pub/search?content_filter=images&page_size=${pageSize}&page=${page}&account=${account}`
        );
        const data = await response.json();
        const pageIds = data.inscriptions.map(
          (inscription: Inscription) => inscription.id
        );
        allIds.push(...pageIds);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      setIds(
        rarity.filter((entry) =>
          allIds.some((inscription: string) => inscription === entry.id)
        )
      );
    } catch (error: any) {
      toast.error(error.message || "Something went wrong", toastStyles);
    }
  };

  const GetUtxos = async (addr: any) => {
    await fetch(`https://api.nintondo.io/api/address/${addr}/utxo?hex=true`)
      .then((res) => res.json())
      .then((result) => {
        const arr2: any = [];
        result.forEach((element: any) => {
          const json = {
            txid: element.txid,
            vout: element.vout,
            value: element.value,
            hex: element.hex,
          };
          arr2.push(json);
        });
        setUtxos(arr2);
      });
  };

  const checkUtxo = async () => {
    const test = await nintondo?.api.getUtxos(address);
    const values = test
      ?.map((utxo, index) => `${index + 1}: ${utxo.value}`)
      .join("\n");
    toast.success(
      `You have ${test?.length} ${
        test?.length === 1 ? "utxo" : "utxos"
      }\n${values}\nAll UTXOs needs to be confirmed before merge.`,
      toastStyles
    );
  };

  const GetFees = async () => {
    const f = await nintondo?.api.getFees();
    if (f) {
      setFeeRateFast(f.fast);
      setFeeRateSlow(f.slow);
    }
  };

  const SetFeeType = (type: any) => {
    if (type == "fast") {
      setFeeType("fast");
      setFeeRate(feeRateFast);
    } else if (type == "slow") {
      setFeeType("slow");
      setFeeRate(feeRateSlow);
    } else if (type == "custom") {
      setFeeType("custom");
    }
  };

  const GetCoingeckoData = async () => {
    await fetch("https://api.coingecko.com/api/v3/coins/bellscoin")
      .then((res) => res.json())
      .then((result) => {
        setDataCoingecko(result);
      });
  };

  const gptFeeCalculate = (
    inputCount: number,
    outputCount: number,
    feeRate: number
  ) => {
    // Constants defining the weight of each component of a transaction
    const BASE_TX_WEIGHT = 10 * 4; // 10 vbytes * 4 weight units per vbyte
    const INPUT_WEIGHT = 148 * 4; // 148 vbytes * 4 weight units per vbyte for each input
    const OUTPUT_WEIGHT = 34 * 4; // 34 vbytes * 4 weight units per vbyte for each output

    // Calculate the weight of the transaction
    const transactionWeight =
      BASE_TX_WEIGHT + inputCount * INPUT_WEIGHT + outputCount * OUTPUT_WEIGHT;

    // Calculate the fee by multiplying transaction weight by fee rate (satoshis per weight unit)
    const fee = Math.ceil((transactionWeight / 4) * feeRate);

    return fee;
  };

  const connectWallet = async () => {
    if (nintondo) {
      try {
        await nintondo.provider.connect();
        setConnected(true);
        toast.success("Wallet connected!", toastStyles);

        const addr = await nintondo.provider.getAccount();
        const bal = await nintondo.provider.getBalance();
        setAddress(addr);
        setBalance(bal);
        GetUtxos(addr);
        GetFees();
        CheckWhitelist(addr);
        try {
          fetchAllPagesFromWallet(addr, 60);
        } catch (error) {
          toast.error("No mints found for your wallet.", toastStyles);
        }
      } catch (error) {
        toast.error("Failed to connect wallet.", toastStyles);
      }
    } else {
      toast.error("Nintondo instance is not initialized", toastStyles);
    }
  };

  const CheckWhitelist = async (address: string) => {
    if (whitelist) {
      const exists = (whitelist as { address: string }[]).some(
        (item) => item.address === address
      );

      if (exists) {
        setIsWhitelisted(true);
      }
    }
  };

  //MINT FUNCTION
  const MintInscription = async (count: number) => {
    if (nintondo) {
      setIsMinting(true);
      const brice =
        (isWhitelisted ? mintPrice / 2 : mintPrice) *
        mintAmount *
        SATS_PER_BELL;
      if (
        mintAmount * (isWhitelisted ? mintPrice / 2 : mintPrice) >
        balance / SATS_PER_BELL
      ) {
        toast.error(
          "Your balance is too low for the amount to mint.",
          toastStyles
        );

        setIsMinting(false);
        return;
      }

      const sender = await nintondo?.provider.getAccount();
      const publickey = await nintondo?.provider.getPublicKey();
      let psbt = new Psbt({ network: networks.bellcoin });

      if (!privKey) {
        throw new Error("Key not found.");
      }
      const keyPair = ECPair.fromWIF(privKey, networks.bellcoin);

      const initialResponse = await fetch(
        `https://content.nintondo.io/api/pub/search?content_filter=images&page_size=60&page=1&account=${mintAddress}`
      );
      const initialData = await initialResponse.json();
      const totalPages = initialData.pages;

      const allIds: string[] = [];

      for (let page = 1; page <= totalPages; page++) {
        const response = await fetch(
          `https://content.nintondo.io/api/pub/search?content_filter=images&page_size=60&page=${page}&account=${mintAddress}`
        );
        const data = await response.json();
        const pageIds = data.inscriptions.map(
          (inscription: Inscription) => inscription.id
        );
        allIds.push(...pageIds);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      if (allIds.length < mintAmount) {
        throw new Error("Not enough IDs available.");
      }

      const shuffledIds = allIds.sort(() => 0.5 - Math.random());
      const data = shuffledIds.slice(0, mintAmount);

      if (count > data.length) {
        toast.error(
          "Requested mint amount exceeds the available NFTs.",
          toastStyles
        );
        setIsMinting(false);
        return;
      }

      const selectedIds = [];
      const nintondoApiUrl = "https://history.nintondo.io/api/pub/";
      for (let i = 0; i < count; i++) {
        let id = data[i];
        let ownerData;
        while (true) {
          const response = await fetch(`${nintondoApiUrl}${id}/owner`);
          if (!response.ok) {
            toast.error("Failed to fetch owner data.", toastStyles);
            setIsMinting(false);
            return;
          }
          ownerData = await response.json();
          if (ownerData.owner === mintAddress) {
            selectedIds.push({
              id: id,
              location: ownerData.location,
              value: ownerData.value,
            });
            break;
          } else {
            id = data[++i];
            if (!id) {
              toast.error("No more valid IDs available.", toastStyles);
              setIsMinting(false);
              return;
            }
          }
        }
      }

      let totalInputValue = 0;
      let totalMintValue = 0;
      try {
        for (let i = 0; i < selectedIds.length; i++) {
          const [txid, vout] = selectedIds[i].location.split("i");
          const utxo = {
            txid,
            vout,
            value: selectedIds[i].value,
            confirmed: true,
          };

          const responseRawTx = await fetch(
            `https://api.nintondo.io/api/tx/${utxo.txid}/hex`
          );

          const rawTx = await responseRawTx.text();
          try {
            psbt.addInput({
              hash: utxo.txid,
              index: parseInt(utxo.vout),
              sequence: 0xffffffff,
              nonWitnessUtxo: Buffer.from(rawTx, "hex"),
            });
          } catch (error) {
            console.error("Failed to add input:", error);
            return;
          }
          totalInputValue += selectedIds[i].value;
          totalMintValue += selectedIds[i].value;
        }
        const responseUtxo = await fetch(
          `https://api.nintondo.io/api/address/${sender}/utxo`
        );
        const utxos = await responseUtxo.json();

        let utxoNumber = 0;

        for (let i = 0; i < utxos.length; i++) {
          if (utxos[i].value >= brice) utxoNumber = i;
        }

        const responseRawTx1 = await fetch(
          `https://api.nintondo.io/api/tx/${utxos[utxoNumber].txid}/hex`
        );
        const rawTx1 = await responseRawTx1.text();

        try {
          psbt.addInput({
            hash: utxos[utxoNumber].txid,
            index: utxos[utxoNumber].vout,
            sequence: 0xffffffff,
            nonWitnessUtxo: Buffer.from(rawTx1, "hex"),
          });
        } catch (error) {
          console.error("Failed to add input:", error);
          return;
        }

        totalInputValue += utxos[utxoNumber].value;

        const fee = gptFeeCalculate(
          psbt.txInputs.length,
          (totalMintValue + 1 + brice) / SATS_PER_BELL,
          feeRate
        );
        const totalOutputValue = totalMintValue + brice + fee;

        if (totalOutputValue > totalInputValue) {
          toast.error(
            "Insufficient inputs for outputs.\nPlease merge your UTXOs.",
            toastStyles
          );
        }

        for (let i = 0; i < selectedIds.length; i++) {
          psbt.addOutput({
            address: sender,
            value: selectedIds[i].value,
          });
        }

        psbt.addOutput({
          address: treasuryAddress,
          value: brice / 2,         //If you don´t want to donate to bellschain, delete the divison by 2, just "brice"
        });

        psbt.addOutput({            //If you don´t want to donate to bellschain, delete this output
          address: donationAddress,
          value: brice / 2,
        });

        psbt.addOutput({
          address: sender,
          value: totalInputValue - totalOutputValue, //change
        });
        for (let i = 0; i < psbt.data.inputs.length - 1; i++) {
          psbt.signInput(i, keyPair);
          psbt.finalizeInput(i);
        }
        const signedPsbtBase64 = await nintondo.provider.signPsbt(
          psbt.toBase64(),
          {
            autoFinalized: false,
            toSignInputs: [
              {
                publicKey: publickey,
                index: psbt.data.inputs.length - 1,
                sighashTypes: undefined,
              },
            ],
          }
        );
        psbt = Psbt.fromBase64(signedPsbtBase64);
        psbt.finalizeInput(psbt.data.inputs.length - 1);

        const transaction = psbt.extractTransaction(true);
        const txHex = transaction.toHex();

        await nintondo.api.pushTx(txHex);
        toast.success("SUCCESS!!", toastStyles);
        const bal = await nintondo.provider.getBalance();
        setBalance(bal);
        ThrowConfetti();
        setIsMinting(false);
      } catch (error) {
        console.error("Error:", error);
        setIsMinting(false);
      }
    }
  };

  function ThrowConfetti(): void {
    confetti({
      particleCount: 400,
      spread: 70,
      origin: { y: 0.6 },
    });
  }

  const ChangeAmount = (a: number) => {
    setMintAmount(a);
  };

  const fetchWhitelist = async () => {
    const response = await fetch("/whitelist.json");
    const result = await response.json();
    setWhitelist(result);
  };

  const fetchRarity = async () => {
    const response = await fetch("/rarity.json");
    const data = await response.json();
    setRarity(data.nfts);
  };

  const openModal = () => {
    modalRef.current?.showModal();
  };

  const GetNftCount = async () => {
    const response = await fetch(
      `https://api.nintondo.io/api/address/${mintAddress}/stats`
    );
    const responseText = await response.text();
    const data = JSON.parse(responseText);
    setWalletCount(data.count);
  };

  useEffect(() => {
    fetchRarity();
    GetCoingeckoData();
    fetchWhitelist();
    GetNftCount();
  }, []);

  useEffect(() => {
    console.log();
  }, [feeRateSlow, feeRateFast, connected, balance]);

  return (
    <div className="h-screen font-easvhs">
      <div className="navbar lg:relative fixed top-0 flex justify-between bg-base-300 z-10">
        {connected && (
          <div className="lg:flex gap-2 items-center hidden">
            <div className="text-center text-sm flex">
              <div role="tablist" className="tabs tabs-boxed">
                <a
                  onClick={() => SetFeeType("slow")}
                  role="tab"
                  className={feeType === "slow" ? "tab tab-active" : "tab"}
                >
                  <div className="flex gap-2">
                    <div>SLOW</div>
                    <div>{feeRateSlow}/vB</div>
                  </div>
                </a>
                <a
                  onClick={() => SetFeeType("fast")}
                  role="tab"
                  className={feeType === "fast" ? "tab tab-active" : "tab"}
                >
                  <div className="flex gap-2">
                    <div>FAST</div>
                    <div>{feeRateFast}/vB</div>
                  </div>
                </a>
                <a
                  onClick={() => SetFeeType("custom")}
                  role="tab"
                  className={feeType === "custom" ? "tab tab-active" : "tab"}
                >
                  CUSTOM
                </a>
              </div>
              {feeType == "custom" && (
                <div className="flex items-center ml-1">
                  <input
                    type="text"
                    placeholder="Fees"
                    className="font-pixel input input-sm w-20 rounded-lg bg-base-200"
                    value={feeRate}
                    onChange={(e) => {
                      setFeeRate(parseInt(e.target.value));
                    }}
                  />
                </div>
              )}
              <button
                onClick={GetFees}
                className="btn btn-ghost rounded text-2xl ml-1"
              >
                ⟳
              </button>
            </div>
          </div>
        )}

        {!connected && <div></div>}
        {!connected && <div>{`Please connect your NINTONDO wallet =>`}</div>}

        {connected && <div className="lg:hidden"></div>}
        {connected && (
          <div className="hidden lg:block text-center">
            <div>{`Welcome ${address?.slice(0, 4)}...${address?.slice(
              -4
            )}`}</div>
            {isWhitelisted && (
              <div className="neon-text">YOU ARE WHITELISTED!!!</div>
            )}
          </div>
        )}
        <div>
          {connected && (
            <div className="drawer drawer-end">
              {" "}
              <input
                id="my-drawer-4"
                type="checkbox"
                className="drawer-toggle"
              />
              <div className="drawer-content flex gap-4 items-center">
                <label
                  htmlFor="my-drawer-4"
                  className="drawer-button btn w-16 btn-primary"
                  onClick={() => fetchAllPagesFromWallet(address, 60)}
                >
                  {`Your \nmints`}
                </label>
                {dataCoingecko && (
                  <div className="text-center text-sm mr-2">
                    <div>Balance: </div>
                    {`${(balance / SATS_PER_BELL).toFixed(2)} $BEL`}
                  </div>
                )}
              </div>
              <div className="drawer-side">
                <label
                  htmlFor="my-drawer-4"
                  aria-label="close sidebar"
                  className="drawer-overlay"
                ></label>
                <div className="menu bg-base-200 text-base-content min-h-full w-80 p-4">
                  <div className="text-center underline mb-1">
                    Your {ids.length} chibis:
                  </div>
                  <div className="text-center text-xs p-2">{`Needs at least 1 confirmation per mint tx for NFTs to show up in here. Stay calm, funds are safu.`}</div>
                  {ids && (
                    <div className=" grid grid-cols-3 mb-12 gap-2">
                      {ids.map((id: any, index) => (
                        <div
                          className="items-center text-center border-2 rounded border-base-100 rounded-b-md"
                          key={index}
                        >
                          <img
                            src={`https://content.nintondo.io/api/pub/content/${id.id}`}
                            alt="pic"
                            className="rounded-t-lg mb-2"
                          />
                          <div className="text-center text-xs">{id.name}</div>
                          <div className="text-center text-xs mt-2">{`Rank: ${id.rank}`}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <div>
            {connected && (
              <button
                onClick={async () => {
                  await splitTxs({
                    utxos: utxos,
                    feeRate: feeRate,
                    amount: 0,
                    singleInscriptionCost: 1000,
                    address: address,
                    network: networks.bellcoin,
                    nintondo: nintondo,
                  });
                  GetUtxos(address);
                }}
                className="btn btn-primary btn-xs w-16 rounded"
              >
                Merge
              </button>
            )}
            {connected && (
              <button
                onClick={checkUtxo}
                className="btn btn-primary btn-xs w-16 rounded"
              >
                Check
              </button>
            )}
          </div>
          <button onClick={connectWallet} className="btn btn-primary">
            {connected ? "Connected" : "Connect"}
          </button>
        </div>
      </div>

      <div className="col-span-4 flex flex-col items-center justify-center mt-16 lg:mt-0 bg-base-100">
        {connected && (
          <div className="flex gap-2 items-center lg:hidden">
            <div className="text-center text-sm flex">
              <div role="tablist" className="tabs tabs-boxed">
                <a
                  onClick={() => SetFeeType("slow")}
                  role="tab"
                  className={feeType === "slow" ? "tab tab-active" : "tab"}
                >
                  <div className="flex gap-2">
                    <div>SLOW</div>
                    <div>{feeRateSlow}/vB</div>
                  </div>
                </a>
                <a
                  onClick={() => SetFeeType("fast")}
                  role="tab"
                  className={feeType === "fast" ? "tab tab-active" : "tab"}
                >
                  <div className="flex gap-2">
                    <div>FAST</div>
                    <div>{feeRateFast}/vB</div>
                  </div>
                </a>
                <a
                  onClick={() => SetFeeType("custom")}
                  role="tab"
                  className={feeType === "custom" ? "tab tab-active" : "tab"}
                >
                  CUSTOM
                </a>
              </div>
              {feeType == "custom" && (
                <div className="flex items-center ml-1">
                  <input
                    type="text"
                    placeholder="Fees"
                    className="font-pixel input input-sm w-20 rounded-lg bg-base-200"
                    value={feeRate}
                    onChange={(e) => {
                      setFeeRate(parseInt(e.target.value));
                    }}
                  />
                </div>
              )}

              <button
                onClick={GetFees}
                className="btn btn-ghost rounded text-2xl ml-1"
              >
                ⟳
              </button>
            </div>
          </div>
        )}
        <h1 className="text-5xl font-chibi blink color-change mt-4 mb-4 text-center">
          CHIBI BELLS
        </h1>
        <Carousel />
        <p className="text-center">
          Dive into ChibiBells, where tiny, quirky characters spread joy and
          cuteness!
        </p>
        <p className="text-center">
          Collect them all and let the giggles and kawaii vibes take over!
        </p>
        <div className="flex gap-8">
          <button
            className="btn btn-secondary rounded my-4 btn-xl text-2xl font-normal"
            onClick={openModal}
          >
            SHOW RARITY
          </button>
        </div>
        <div className="lg:flex text-center gap-4 items-center border-2 border-base-200 rounded-lg bg-base-100">
          <p className="ml-2">MINT AMOUNT:</p>
          <div role="tablist" className="tabs tabs-boxed gap-2">
            <button
              onClick={() => ChangeAmount(1)}
              role="tab"
              className={
                mintAmount === 1
                  ? "tab tab-active"
                  : connected
                  ? "hover:bg-secondary tab"
                  : "tab"
              }
              disabled={!connected}
            >
              <div className="flex gap-2">
                <div>1</div>
              </div>
            </button>
            <button
              onClick={() => ChangeAmount(5)}
              role="tab"
              className={
                mintAmount === 5
                  ? "tab tab-active"
                  : connected
                  ? "hover:bg-secondary tab"
                  : "tab"
              }
              disabled={!connected}
            >
              <div className="flex gap-2">
                <div>5</div>
              </div>
            </button>
            <button
              onClick={() => ChangeAmount(10)}
              role="tab"
              className={
                mintAmount === 10
                  ? "tab tab-active"
                  : connected
                  ? "hover:bg-secondary tab"
                  : "tab"
              }
              disabled={!connected}
            >
              10
            </button>
            <button
              onClick={() => ChangeAmount(50)}
              role="tab"
              className={
                mintAmount === 50
                  ? "tab tab-active"
                  : connected
                  ? "hover:bg-secondary tab"
                  : "tab"
              }
              disabled={!connected}
            >
              <div className="flex gap-2">
                <div>50</div>
              </div>
            </button>
          </div>
          <div className="mr-4">{`${
            isWhitelisted ? mintPrice / 2 : mintPrice
          } $BELLS each`}</div>
        </div>
        <div className="flex items-center mt-6 gap-4">
          <div>Progress:</div>
          <progress
            className="progress w-28 lg:w-72"
            value={mintSupply - walletCount}
            max={mintSupply}
          ></progress>
          <div>
            {mintSupply - walletCount}/{mintSupply}
          </div>

          <button onClick={GetNftCount} className="rounded text-2xl ml-1">
            ⟳
          </button>
        </div>
        <div className="text-xs">
          The progress may be displayed with a delay
        </div>
        <button
          className="btn lg:w-1/3 h-20 text-3xl btn-secondary disabled:opacity-50 mt-6 font-normal mb-16 lg:mb-0"
          onClick={() => {
            MintInscription(mintAmount);
          }}
          disabled={!connected || isMinting}
        >
          <div
            className={`${
              !isMinting && mintAmount == 50
                ? "animated-text"
                : isMinting
                ? "text-white"
                : ""
            } flex`}
          >
            {isMinting
              ? "Minting..."
              : `Mint for ${
                  (isWhitelisted ? mintPrice / 2 : mintPrice) * mintAmount
                } $BELLS`}
            {isMinting && <Loader />}
          </div>
        </button>
        <a href="https://bellsight.xyz/address/BEGJMVqLYRJkGwvwmsZDDjERpzxGqdyzXT" target="_blank" className="mt-2 fire-text" data-text="50% of the mint costs is directly donated to the BELLSCOIN donation address!">50% of the mint costs is directly donated to the BELLSCOIN donation address!</a>
      </div>
      <dialog id="previewName" className="modal" ref={modalRef}>
        <div className="p-4 bg-base-100 rounded-lg">
          <form method="dialog" className="flex justify-between mb-2">
            <div></div>
            <div className="text-2xl">RARITY OVERVIEW</div>
            <button className="border-2 w-8 rounded-lg hover:bg-base-300">
              X
            </button>
          </form>
          <RarityView />
        </div>
      </dialog>
      <Footer />
    </div>
  );
};
