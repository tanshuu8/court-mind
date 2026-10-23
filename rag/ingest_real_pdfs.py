import asyncio
from pathlib import Path
from rag.ingestion.loader import DocumentLoader
from rag.ingestion.parser import LegalDocumentParser
from rag.ingestion.pipeline import LegalIngestionPipeline
from rag.chunking.splitter import LegalSemanticChunker
from rag.embeddings.embedder import TextEmbedder
from rag.retrieval.vector_store import PgVectorRetriever
from rag.generation.llm_client import LLMClient
from rag.generation.pipeline import LegalRAGPipeline
from rag.advocate_matching.matcher import AdvocateMatcher
from rag.evaluation.evaluator import RAGEvaluator


async def run_real_pdf_rag_pipeline() -> None:
    print("=" * 80)
    print(" CourtMind — Real Legal Judgment PDF Ingestion & RAG Validation")
    print("=" * 80)

    project_root = Path(__file__).resolve().parent.parent
    pdf_dir = project_root / "data" / "legal_judgments"

    print(f"\n[1] Initializing Ingestion, Vector Retriever, RAG Engine & Advocate Matcher...")
    embedder = TextEmbedder()
    retriever = PgVectorRetriever()
    retriever.clear()
    llm_client = LLMClient()
    advocate_matcher = AdvocateMatcher()
    evaluator = RAGEvaluator()

    ingestion_pipeline = LegalIngestionPipeline(
        loader=DocumentLoader(),
        parser=LegalDocumentParser(),
        chunker=LegalSemanticChunker(chunk_size=500, chunk_overlap=60),
        embedder=embedder,
        retriever=retriever,
    )

    rag_pipeline = LegalRAGPipeline(
        embedder=embedder,
        retriever=retriever,
        llm_client=llm_client,
        advocate_matcher=advocate_matcher,
    )

    # 1. Ingest real PDFs
    print(f"\n[2] Ingesting real legal judgments from: {pdf_dir}")
    summary = await ingestion_pipeline.ingest_directory(pdf_dir)
    print(f" -> Real Judgment PDFs Found & Ingested : {summary['documents_ingested']}")
    print(f" -> Documents Requiring OCR              : {summary['documents_requiring_ocr']}")
    print(f" -> Total Page-Attributed Chunks Indexed : {summary['total_chunks_indexed']}\n")

    for doc in summary["details"]:
        print(f"    * [{doc['doc_id']}] {doc['title']} ({doc['year']})")
        print(f"      Court: {doc['court']} | Total Pages: {doc['page_count']} | Chunks: {doc['chunks_indexed']}")

    # 2. Test Document Summarization (e.g. for Civil Case - Land Acquisition)
    civil_doc_id = "CIVIL APPEAL NO. 1615 OF 2023"
    print("\n" + "=" * 80)
    print(f" [3] Testing Structured Document Summarization for: {civil_doc_id}")
    print("=" * 80)
    doc_summary = await rag_pipeline.summarize_document(civil_doc_id)
    print(doc_summary["summary"])
    print(f"\nAdvocate Prompt: {doc_summary['advocate_cta']['cta_title']} -> {doc_summary['advocate_cta']['cta_description']}")

    # 3. Test Grounded Question Answering with Page Citations
    print("\n" + "=" * 80)
    print(" [4] Testing Grounded Legal Q&A with Source Page Citations")
    print("=" * 80)

    qa_queries = [
        {
            "desc": "Civil Appeal Query (Land Acquisition)",
            "query": "What did the Supreme Court observe regarding interest on solatium under the Land Acquisition Act in Civil Appeal No 1615 of 2023?",
            "case_id": civil_doc_id,
        },
        {
            "desc": "Criminal Law Query (Bachan Singh)",
            "query": "What did the Court hold regarding hearing of an appeal under the Criminal Procedure Code in Bachan Singh v. State of Punjab?",
            "case_id": None,
        },
        {
            "desc": "Unsupported / Out-of-Domain Query",
            "query": "What was the quantum of punitive damages awarded in the 2024 California patent trial between Apple and Masimo?",
            "case_id": None,
        },
    ]

    for item in qa_queries:
        print(f"\n--- Query: {item['desc']} ---")
        print(f"Question: {item['query']}")
        res = await rag_pipeline.answer_question(item["query"], case_id=item["case_id"], top_k=3)
        print(f"\nAnswer:\n  {res['answer']}")
        print(f"\nStatus: {res['status']} | Grounded: {res['is_grounded']}")
        if res["citations"]:
            print(f"Citations ({len(res['citations'])}):")
            for cit in res["citations"]:
                print(f"  - {cit['title']} ({cit['year']}), Page {cit['page_number']} [{cit['chunk_id']}] (Score: {cit['similarity_score']})")
        print(f"Advocate CTA: {res['advocate_cta']['cta_title']} ({res['advocate_cta']['context_payload']['practice_area']})")

    # 4. Test Explore Possible Options
    print("\n" + "=" * 80)
    print(" [5] Testing 'Explore Possible Options' Decision-Support Action")
    print("=" * 80)
    user_problem = (
        "My agricultural land was acquired by the state government under the Land Acquisition Act without paying "
        "statutory solatium and statutory interest on enhanced compensation. What possible options are available?"
    )
    print(f"User Problem Description:\n{user_problem}\n")
    options_res = await rag_pipeline.explore_possible_options(user_problem)
    print(options_res["analysis"])
    print(f"\nAdvocate CTA: {options_res['advocate_cta']['cta_title']} ({options_res['advocate_cta']['context_payload']['practice_area']})")

    # 5. Test Advocate Matching Registry
    print("\n" + "=" * 80)
    print(" [6] Testing Advocate Matching Engine with Persisted Profiles")
    print("=" * 80)
    match_result = advocate_matcher.find_suitable_advocates(practice_area="Civil Law / Land Acquisition")
    print(f"Matched Advocates ({match_result['total_matched']}):")
    for adv in match_result["advocates"]:
        print(f"  * {adv['name']} | Exp: {adv['experience_years']} yrs | Status: {adv['verification_badge']} | Location: {adv['location']}")
        print(f"    Courts: {', '.join(adv['courts'])}")

    print("\n" + "=" * 80)
    print(" Real PDF Ingestion & RAG Validation Completed Successfully")
    print("=" * 80)


def main() -> None:
    asyncio.run(run_real_pdf_rag_pipeline())


if __name__ == "__main__":
    main()
