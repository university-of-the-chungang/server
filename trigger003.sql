CREATE TRIGGER trigger003
on TBL_GROUP_SET_LIST
for INSERT
AS 
declare @agent_cd int
declare @group_cd int
declare @set_cd int
declare @cnt int
declare @group_cnt int
declare @seq int

select @group_cd = GROUP_SET_CD FROM inserted
select @agent_cd = AGENT_CD FROM inserted

select @cnt = A.CNT FROM (SELECT COUNT(AGENT_CD) AS CNT FROM TBL_GROUP_SET_LIST T2 WHERE T2.GROUP_SET_CD = @group_cd) A;

update TBL_GROUP_INFO SET AGENT_COUNTING =  @cnt
	WHERE GROUP_SET_CD = @group_cd



