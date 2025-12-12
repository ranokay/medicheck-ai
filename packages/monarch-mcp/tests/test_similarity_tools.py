import pytest
from monarch_mcp.tools.similarity import SimilarityApi

@pytest.mark.asyncio
async def test_compare_termsets(mock_client):
    """Test compare_termsets calls the correct semsim compare endpoint."""
    similarity_api = SimilarityApi()
    subjects = ["HP:0001250", "HP:0001290"]
    objects = ["MONDO:0005015", "MONDO:0007947"]
    
    await similarity_api.compare_termsets(mock_client, subjects=subjects, objects=objects)
    
    subjects_str = ",".join(subjects)
    objects_str = ",".join(objects)
    expected_url = f"semsim/compare/{subjects_str}/{objects_str}"
    
    mock_client.get.assert_called_once_with(
        expected_url,
        params={"metric": "ancestor_information_content"}
    )

@pytest.mark.asyncio
async def test_compare_termsets_with_metric(mock_client):
    """Test compare_termsets with different similarity metric."""
    similarity_api = SimilarityApi()
    subjects = ["HP:0001250"]
    objects = ["HP:0001251"]
    
    await similarity_api.compare_termsets(
        mock_client, 
        subjects=subjects, 
        objects=objects,
        metric="jaccard_similarity"
    )
    
    expected_url = f"semsim/compare/HP:0001250/HP:0001251"
    mock_client.get.assert_called_once_with(
        expected_url,
        params={"metric": "jaccard_similarity"}
    )

@pytest.mark.asyncio
async def test_find_similar_terms(mock_client):
    """Test find_similar_terms calls the correct semsim search endpoint."""
    similarity_api = SimilarityApi()
    termset = ["HP:0001250"]
    search_group = "Human Diseases"
    
    await similarity_api.find_similar_terms(
        mock_client, 
        termset=termset, 
        search_group=search_group, 
        limit=5
    )
    
    termset_str = ",".join(termset)
    expected_url = f"semsim/search/{termset_str}/{search_group}"
    
    mock_client.get.assert_called_once_with(
        expected_url,
        params={
            "metric": "ancestor_information_content",
            "directionality": "bidirectional",
            "limit": 5
        }
    )

@pytest.mark.asyncio
async def test_find_similar_terms_with_directionality(mock_client):
    """Test find_similar_terms with directionality parameter."""
    similarity_api = SimilarityApi()
    termset = ["HP:0001250", "HP:0001290"]
    search_group = "Mouse Genes"
    
    await similarity_api.find_similar_terms(
        mock_client,
        termset=termset,
        search_group=search_group,
        metric="phenodigm_score",
        directionality="subject_to_object",
        limit=15
    )
    
    termset_str = ",".join(termset)
    expected_url = f"semsim/search/{termset_str}/{search_group}"
    
    mock_client.get.assert_called_once_with(
        expected_url,
        params={
            "metric": "phenodigm_score",
            "directionality": "subject_to_object",
            "limit": 15
        }
    )