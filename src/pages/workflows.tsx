import Head from "next/head";
import Layout from "@/components/Layout";
import WorkflowList from "@/components/Workflows/WorkflowList";

export default function Workflows() {
  return (
    <>
      <Head>
        <title>Workflows - Content Feeder</title>
        <meta name="description" content="Manage content processing workflows" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout currentPage="workflows">
        <WorkflowList />
      </Layout>
    </>
  );
}
