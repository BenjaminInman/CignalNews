// Ad placeholder. Drop your ad network code (e.g. AdSense) or a direct-sold
// creative inside the inner div later. Kept visually light so ads never dominate
// the page — training programs are the primary revenue driver.
export default function AdSlot({ format = "leaderboard" }) {
  const size = format === "rectangle" ? "300 × 250" : "728 × 90";
  return (
    <div className={`ad-slot ad-${format}`}>
      <span className="ad-label">Advertisement</span>
      <span className="ad-ph">{size}</span>
    </div>
  );
}
