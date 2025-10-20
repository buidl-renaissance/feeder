import Head from "next/head";
import Layout from "@/components/Layout";
import SourceList from "@/components/Sources/SourceList";

export default function Sources() {
  return (
    <>
      <Head>
        <title>Sources - Content Feeder</title>
        <meta name="description" content="Manage content sources" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout currentPage="sources">
        <SourceList />
      </Layout>
    </>
  );
}
