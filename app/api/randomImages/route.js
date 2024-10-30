// app/api/randomImages/route.js

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const imagesDirectory = path.join(process.cwd(), 'public/images');
  console.log(imagesDirectory)
  const filenames = fs.readdirSync(imagesDirectory);
  const randomImages = filenames.sort(() => 0.5 - Math.random()).slice(0, 9);
  const images = randomImages.map(name => path.join('images', name));

  return NextResponse.json(images);
}
