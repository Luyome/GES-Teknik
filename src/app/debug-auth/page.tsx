"use client";

import { useState } from "react";
import { debugAuthAction } from "./actions";

export const dynamic = "force-dynamic";

export default function DebugAuthPage() {
  const [result, setResult] = useState<string>("");

  return (
    <div style={{ padding: 24, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
      <button
        onClick={async () => {
          const res = await debugAuthAction();
          setResult(JSON.stringify(res, null, 2));
        }}
      >
        Test auth()
      </button>
      <pre>{result}</pre>
    </div>
  );
}
