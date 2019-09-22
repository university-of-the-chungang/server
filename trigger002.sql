ALTER TRIGGER trigger002
on TBL_GROUP_INFO
for INSERT, UPDATE
AS 
declare @agent_cd int
declare @group_cd int
declare @cnt int
declare @group_cnt int
declare @seq int

select @group_cd = GROUP_SET_CD FROM inserted
select @cnt = B.CNT FROM (SELECT COUNT(T1.AGENT_CD) AS CNT FROM TBL_AGENT_INFO T1 INNER JOIN TBL_GROUP_SET_LIST T2 ON T1.AGENT_CD = T2.AGENT_CD INNER JOIN TBL_GROUP_INFO T3 ON T2.GROUP_SET_CD = T3.GROUP_SET_CD WHERE T3.GROUP_SET_CD = @group_cd GROUP BY T3.GROUP_SET_CD) B

update TBL_GROUP_INFO SET AGENT_COUNTING =  @cnt
	WHERE GROUP_SET_CD = @group_cd



