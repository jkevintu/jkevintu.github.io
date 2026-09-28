import type { APIRoute } from 'astro';
import { INK_HEX } from '../lib/iso/palette';
import { cubeSvg } from '../lib/iso/sprite';

export const GET: APIRoute = () =>
  new Response(cubeSvg({ top: INK_HEX.yellow, left: INK_HEX.pink, right: INK_HEX.blue }, 32), {
    headers: { 'Content-Type': 'image/svg+xml' },
  });
