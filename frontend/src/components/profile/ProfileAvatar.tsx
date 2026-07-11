interface Props {
  name: string;
  size?: number;
}

function ProfileAvatar({
  name,
  size = 44,
}: Props) {
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      style={{
        width: size,
        height: size,
      }}
      className="
        rounded-full
        bg-cyan-500
        flex
        items-center
        justify-center
        font-semibold
        text-white
        select-none
      "
    >
      {initials}
    </div>
  );
}

export default ProfileAvatar;