import { NextResponse } from "next/server";
export function middleware(request: import("next/server").NextRequest) {
  const url=request.nextUrl;
  const preview=url.hostname.endsWith('.workers.dev') || url.hostname.endsWith('.pages.dev') || url.hostname==='localhost';
  if(preview && url.pathname==='/robots.txt') return new NextResponse('User-agent: *\nDisallow: /\n',{headers:{'Content-Type':'text/plain; charset=utf-8','X-Robots-Tag':'noindex, nofollow, noarchive'}});
  if(url.hostname==='www.disordat.org'){const target=url.clone();target.hostname='disordat.org';return NextResponse.redirect(target,301);}
  const response=NextResponse.next();
  if(preview) response.headers.set('X-Robots-Tag','noindex, nofollow, noarchive');
  return response;
}
export const config={matcher:'/:path*'};
