import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // flatConfigs.recommended also registers jsx-a11y, which eslint-config-next already defines.
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "lucide-react",
              message: "Use @heroicons/react (see docs/design/STYLE.md).",
            },
          ],
        },
      ],
      ...jsxA11y.flatConfigs.recommended.rules,
      "jsx-a11y/label-has-associated-control": [
        "error",
        {
          labelComponents: ["Label"],
          labelAttributes: ["htmlFor"],
          controlComponents: [
            "Input",
            "Textarea",
            "NativeSelect",
            "Checkbox",
            "Radio",
          ],
          depth: 3,
        },
      ],
    },
  },
  globalIgnores([
    ".design-tools/**",
    ".browser-before/**",
    ".npm-cache/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
  ]),
]);

export default eslintConfig;
