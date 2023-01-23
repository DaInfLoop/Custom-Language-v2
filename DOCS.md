# Custom Language v2 Docs

## @
Comment.
```
@ Wow that was really cool!
```

## declare \<variable name> : \<type>
Declares a new variable. `type` must be one of `str, int, float, bool or obj`.
```
declare myStr : str
declare myInt : int
declare myFloat : float
declare myBool : bool
declare myObj : obj
```

## assign \<variable name> = value
Assigns a value to a variable. Variable must be declared.
```
assign myStr = "Hello world!"
assign myInt = 42
assign myFloat = 3.1415
assign myBool = true
```

## out \<value>
Outputs a value.
```
out "Hello world!"
out myStr
```

## Objects
Custom Language v2 now has object support, unlike v1 where you had to name your variables "obj.prop".

```
declare myObj : obj
declare myObj.str : str
declare myObj.int : int

assign myObj.str = "Yo!"
assign myObj.int = 42

out myObj
```

This outputs: 
```json
{"str": "Yo!","int": 42}
```
