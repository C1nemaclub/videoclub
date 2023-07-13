
function Navbar({myId}: { myId: string }) {
  return (
    <nav className='bg-sky-800 w-full p-4 flex items-center h-full gap-2 justify-evenly'>
      <h1 className='text-slate-50 text-2xl font-semibold'>VideoClub</h1>
      <h2 className="text-slate-50 font-bold text-lg">My Id: {myId}</h2>
    </nav>
  );
}

export default Navbar;
