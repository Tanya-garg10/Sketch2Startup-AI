AGENTS=["planner","architect","builder","database","api","tester","documentation","deployment"]
def run_agent(name:str,prompt:str=""):
    return {"agent":name,"status":"completed","progress":100,"logs":[f"{name} received prompt",f"{name} generated structured output"],"output":{"summary":f"{name.title()} artifact for Sketch2Startup AI","prompt":prompt}}
def analyze_upload(filename:str):
    return {"elements":[{"type":"navbar","confidence":0.93},{"type":"button","label":"CTA","confidence":0.88},{"type":"form","fields":["email","password"],"confidence":0.84}],"source":filename}
