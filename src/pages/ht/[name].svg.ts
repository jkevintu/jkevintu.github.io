import type { APIRoute, GetStaticPaths } from 'astro';
import { HALFTONES, halftoneSvg } from '../../lib/halftone';

export const getStaticPaths: GetStaticPaths = () => Object.keys(HALFTONES).map((name) => ({ params: { name } }));

export const GET: APIRoute = ({ params }) =>
  new Response(halftoneSvg(HALFTONES[params.name as string]), { headers: { 'Content-Type': 'image/svg+xml' } });
