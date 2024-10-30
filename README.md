# Bellscoin Mint page template

This website is a template for a typical mint experience for $BELLS. 

This will not work with all wallet types depending on your inscription methods. If you use oldschool p2sh inscriptions, taproot will not be supported. 

## Settings and preparations

- The collection must be completely set up, i.e. all inscriptions must already be available in a wallet and there must be an inscriptions.json file in [ordinals standard format](https://github.com/ordinals-wallet/ordinals-collections). You can use [BellsNftTools](https://github.com/0xsol1d/BellsNftTools) to inscribe your colletion as it creates this file at art creation for you and puts in 
- You have to set your treasury address that will recieve the mint funds:

```js
const treasuryAddress: string = "YOUR_TREASURY_ADDRESS_HERE";
const donationAddress: string = "BEGJMVqLYRJkGwvwmsZDDjERpzxGqdyzXT";       //this is the official bellschain donation address
```

- You will need to setup an .env file (or enviroment vars when you deploy via vercel) with the private key and the wallet address of the wallet that holds the inscriptions:

```
NEXT_PUBLIC_PRIVATE_KEY=<PRIVATE_KEY>
NEXT_PUBLIC_ADDRESS=<WALLET ADDRESS>
```

- If the rarity function is to be used, then the rarity.json file must be available (see public folder). This can be created from the correct inscriptions.json file in the ordinals standard with this [BellsNftTools](https://github.com/0xsol1d/BellsNftTools). This collection can also help to inscribe the collection.
- The number of mints is already predefined in the return function of the page.tsx file. This can simply be changed as required.

```js
<button
    onClick={() => ChangeAmount(5)}             //change this number here
    role="tab"
    className={
    mintAmount === 5                            //and here
    ? "tab tab-active"
    : connected
    ? "hover:bg-secondary tab"
    : "tab"
    }
    disabled={!connected} >
    <div className="flex gap-2">
        <div>5</div>                                //and here
    </div>
</button>
```

- There should be a minimum understanding of the structure of a transaction in order to be able to adapt the MintInscription() function if necessary. The website assumes that, as with the CHibiBElls mint, half of the mint price will go directly to the bellscoin donation address if this is not desired.

```js
psbt.addOutput({
    address: treasuryAddress,
    value: brice / 2,         //If you don´t want to donate to bellschain, delete the divison by 2, just "brice"
});

psbt.addOutput({            //If you don´t want to donate to bellschain, delete this output
    address: donationAddress,
    value: brice / 2,
});
```

## Text effects

You can use the following text effects to adjust the appearance inside the classNames:

- neon-text
- blink
- color-change
- fire-text (this requires a data-text field in the object with the same text)

