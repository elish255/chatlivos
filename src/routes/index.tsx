import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chatlivo Site Tanzania | Lipwa Pesa kwa Kuchati na Wazungu" },
      { name: "description", content: "Chatlivo Site ni jukwaa nambari moja Tanzania linalokuwezesha kupata kipato na kulipwa pesa kwa kuchati na wazungu na kuwafundisha Kiswahili mtandaoni." },
      { property: "og:title", content: "Chatlivo Site Tanzania | Lipwa Pesa kwa Kuchati na Wazungu" },
      { property: "og:description", content: "Ungana na Waafrika wanaoingiza kipato kila siku kwa kuchati na wazungu na kuwafundisha Kiswahili. Malipo ni papo hapo kupitia M-Pesa, Mix by Yas, Airtel au Benki." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <iframe title="Chatlivo Site" src="/chatlivo-original.html" className="fixed inset-0 h-full w-full border-0" />;
}