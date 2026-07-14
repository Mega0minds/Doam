'use client';
const avatarColors = [
  "bg-primary", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"
];
const initials = ["A", "K", "T", "M", "J"];

const SocialProof = () => (
  <div className="flex items-center justify-center gap-3 mb-10">
    <div className="flex -space-x-2">
      {avatarColors.map((color, i) => (
        <div
          key={i}
          className={`w-8 h-8 rounded-full ${color} border-2 border-background flex items-center justify-center text-[11px] font-bold text-primary-foreground`}
        >
          {initials[i]}
        </div>
      ))}
    </div>
    <p className="text-sm text-muted-foreground">
      Join <span className="font-semibold text-foreground">500+</span> students already getting things done
    </p>
  </div>
);

export default SocialProof;
