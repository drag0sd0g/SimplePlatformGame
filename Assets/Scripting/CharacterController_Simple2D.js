public var f_speed : float = 5.0;
public var loopSprites : MySpriteManager[]; //0-Stay, 1-Walk
private var in_direction : int;  // 1 for right, -1 for left

private var b_isJumping : boolean;
private var f_height : float;
private var f_lastY : float;
public var jumpSprite : MyJumpSpriteManager;
public var layerMask : LayerMask; // for raycast

function Start () {
	in_direction = 1;
	
	//init sprite managers
	for(var i : int = 0; i < loopSprites.length; i++){
		loopSprites[i].init();
	}
	
	//update main camera to character's position
	Camera.main.transform.position = new Vector3(transform.position.x, transform.position.y, 
	Camera.main.transform.position.z);
	
	mesh = GetComponent(MeshFilter).sharedMesh; //get character mesh
	//get height from top of the charcater to the bottom of the box collider
	f_height = mesh.bounds.size.y * transform.localScale.y;
	b_isJumping = false;
	f_lastY = transform.position.y; //last y-axis position of the character
}

function Update () {
	if(!b_isJumping){
		if (Input.GetButton("Horizontal")){
			//walking
			in_direction = Input.GetAxis("Horizontal") < 0 ? -1 : 1;
			rigidbody.velocity = new Vector3((in_direction * f_speed), rigidbody.velocity.y, 0);
			//reset stay animation frame back to the frist frame
			loopSprites[0].resetFrame();
			//update walking animation while the character is walking 
			loopSprites[1].updateAnimation(in_direction, renderer.material);
		} else {
			//Stay
			//Reset walking animation frame back to the first frame
			loopSprites[1].resetFrame();
			//update stay animation while the character is not walking
			loopSprites[0].updateAnimation(in_direction, renderer.material);
		}
		
		if(Input.GetButton("Jump")){
			b_isJumping = true;
			loopSprites[0].resetFrame(); //reset walk
			loopSprites[1].resetFrame(); //reset stay
			rigidbody.velocity = new Vector3(rigidbody.velocity.x, -Physics.gravity.y,0);		
		}
	} else {
		jumpSprite.updateJumpAnimation(in_direction, rigidbody.velocity.y, renderer.material);
	}
}

//called after all Update() functions to update camera again
function LateUpdate() {
	//Checking Jumping by using Raycast
	var hit : RaycastHit;
	var v3_hit : Vector3 = transform.TransformDirection (-Vector3.up) * (f_height * 0.5);
	var v3_right : Vector3 = new Vector3(transform.position.x + (collider.bounds.size.x*0.45), 
	transform.position.y, transform.position.z);
	var v3_left : Vector3 = new Vector3(transform.position.x - (collider.bounds.size.x*0.45), 
	transform.position.y, transform.position.z);

    if (Physics.Raycast (transform.position, v3_hit, hit, 2.5, layerMask.value)) {
        b_isJumping = false;
    } else if (Physics.Raycast (v3_right, v3_hit, hit, 2.5, layerMask.value)) {
   		if (b_isJumping) {
        	b_isJumping = false;
        }
    } else if (Physics.Raycast (v3_left, v3_hit, hit, 2.5, layerMask.value)) {
        if (b_isJumping) {
        	b_isJumping = false;
        }
    } else {
		if (!b_isJumping) {
	    	if (Mathf.Floor(transform.position.y) == f_lastY) {
	    		b_isJumping = false;
	    	} else {
	    		b_isJumping = true;
	    	}
	    }
	}
    f_lastY = Mathf.Floor(transform.position.y);

	Camera.main.transform.position = new Vector3(transform.position.x, transform.position.y, 
	Camera.main.transform.position.z);
}

public function OnDrawGizmos() : void {
	mesh = GetComponent(MeshFilter).sharedMesh;
	f_height = mesh.bounds.size.y * transform.localScale.y;
	var v3_right : Vector3 = new Vector3(transform.position.x + (collider.bounds.size.x*0.45), 
	transform.position.y, transform.position.z);
	var v3_left : Vector3 = new Vector3(transform.position.x - (collider.bounds.size.x*0.45), 
	transform.position.y, transform.position.z);

	Gizmos.color = Color.red;
	Gizmos.DrawRay(transform.position, transform.TransformDirection(-Vector3.up) * (f_height * 0.5));
	Gizmos.DrawRay(v3_right,  transform.TransformDirection(-Vector3.up) * (f_height * 0.5));
	Gizmos.DrawRay(v3_left,  transform.TransformDirection(-Vector3.up) * (f_height * 0.5));
}


class MySpriteManager {
	public var spriteTexture : Texture2D; //e.g. walk, stay, etc
	public var in_framePerSec : int ; // get frame per second to calculate time
	public var in_gridX : int ; //get max number of horizontal images
	public var in_gridY : int ; //get max number of vertical images
	
	private var f_timePercent : float;
	private var f_nextTime : float; // Update time by using frame/second
	private var f_gridX : float;
	private var f_gridY : float;
	private var in_curFrame : int;	

	public function init(){
		f_timePercent = 1.0/in_framePerSec;
		f_nextTime = f_timePercent; //Update time by using frame/second
		f_gridX = 1.0/in_gridX;
		f_gridY = 1.0/in_gridY;
		in_curFrame = 1;
	}
	
	//this function updates the animation by manipulating the scale and offset of the material 
	public function updateAnimation(_direction : int, _material : Material) : void{
		//update material
		_material.mainTexture = spriteTexture;
		//Update frame by time
		if(Time.time > f_nextTime){
			f_nextTime = Time.time + f_timePercent;
			in_curFrame++;
			if(in_curFrame > in_framePerSec){
				in_curFrame = 1;
			}
		}
		
		_material.mainTextureScale = new Vector2(_direction * f_gridX, f_gridY);
		var in_col : int = 0;
		if(in_gridY > 1){
			//if there is more than one grid on the y-axis update the texture
			in_col = Mathf.Ceil(in_curFrame/in_gridX);
		}
		
		if(_direction == 1) { //right
			_material.mainTextureOffset = new Vector2(((in_curFrame) % in_gridX) * f_gridX, in_col * f_gridY);
		} else { //Left + flip texture
			_material.mainTextureOffset = new Vector2(((in_gridX + (in_curFrame)%in_gridX)) * f_gridX,
			in_col*f_gridY);
		}
		
	}
	
	public function resetFrame():void{
		in_curFrame = 1;
	}
}

class MyJumpSpriteManager {
	public var t_jumpStartTexture : Texture2D; //Alternative Jump Texture play after t_jumpReadyTextures
	public var t_jumpAirTexture : Texture2D; //Alternative Jump Texture play when the player in the air at the top position of projectile
	public var t_jumpDownTexture : Texture2D; //Alternative Jump Texture play when the player fall to the ground
	
	public function updateJumpAnimation (_direction : int, _velocityY : float, _material : Material) : void {
		//Checking for the player position in the air
		if ((_velocityY >= -2.0) && (_velocityY <= 2.0)) { //Top of the projectile
			_material.mainTexture = t_jumpAirTexture;
		} else if (_velocityY > 2.0) { //Start Jump
			_material.mainTexture = t_jumpStartTexture;
		} else {  //Fall
			_material.mainTexture = t_jumpDownTexture;
		}
		_material.mainTextureScale = new Vector2 (_direction * 1, 1);
		_material.mainTextureOffset = new Vector2 (_direction * 1, 1);
	}
}
