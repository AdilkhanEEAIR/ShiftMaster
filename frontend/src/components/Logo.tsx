interface Props { size?: number }

export default function Logo({ size = 30 }: Props) {
  return (
    <div className="logo-mark" style={{ width: size, height: size, borderRadius: size * 0.27 }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
        <path
          d="M4 6.5C4 5.12 5.12 4 6.5 4S9 5.12 9 6.5V11h6V6.5C15 5.12 16.12 4 17.5 4S20 5.12 20 6.5v11c0 1.38-1.12 2.5-2.5 2.5S15 18.88 15 17.5V14H9v3.5C9 18.88 7.88 20 6.5 20S4 18.88 4 17.5v-11z"
          fill="currentColor"
        />
      </svg>
    </div>
  )
}