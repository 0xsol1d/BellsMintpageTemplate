import Link from "next/link";
import React from "react";
import { GitHubIcon, XIcon } from "../utils/Icons";

export const Footer: React.FC = ({}) => {
  return (
    <div>
      <div className="fixed bottom-0 left-0 right-0 bg-base-200 p-2 flex justify-between w-screen z-50">
        <div className="font-chibi">CHIBI BELLS</div>
        <a href="https:nintodno.io" target="blank" className="hover:text-yellow-700">powered by NINTONDO</a>
        <div className="flex gap-2">
            <a href="https://github.com/0xsol1d"><GitHubIcon/></a>
            <a href="https://x.com/bells_chibi"><XIcon/></a>
            
        </div>
      </div>
    </div>
  );
};
