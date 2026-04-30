package rocks.zipcode.blozzer.payload;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
public class CategoryDTO {

	private Integer categoryId;
	@NotBlank
	@Size(min=4, message = "Title cannot be less than 4!!")
	private String categoryTitle;
	
	@NotBlank
	@Size(min = 10, message = "Description cannot be less than 10 characters !!!")
	private String categoryDescription;

	public CategoryDTO() {
	}

	public Integer getCategoryId() {
		return categoryId;
	}

	public void setCategoryId(Integer categoryId) {
		this.categoryId = categoryId;
	}

	public String getCategoryTitle() {
		return categoryTitle;
	}

	public void setCategoryTitle(String categoryTitle) {
		this.categoryTitle = categoryTitle;
	}

	public String getCategoryDescription() {
		return categoryDescription;
	}

	public void setCategoryDescription(String categoryDescription) {
		this.categoryDescription = categoryDescription;
	}
}
