package rocks.zipcode.blozzer.payload;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.Size;
public class UserDTO {
	private int id;
	@NotEmpty
	@Size(min=4, message = "User name should be min of 4 characters !!")
	private String name;
	@Email(message = "Please enter valid Email address !!")
	private String email;
	@NotEmpty
	@Size(min=8, max=20, message = "Please Enter password between 8 to 20 chracters !!")
	private String password;
	@NotEmpty
	private String about;

	public UserDTO() {
	}

	public int getId() {
		return id;
	}

	public void setId(int id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public String getAbout() {
		return about;
	}

	public void setAbout(String about) {
		this.about = about;
	}
}
